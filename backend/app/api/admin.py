from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
import shutil
import os
import hashlib
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.db.database import get_db, KnowledgeDoc, ChatRecord, Feedback
from app.core.rag import add_documents, set_active_persona

DEMO_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "示范景区公开资料包")
DEMO_DATA_DIR = os.path.abspath(DEMO_DATA_DIR)

router = APIRouter()

# 角色 → ZIP 文件映射
PERSONA_ZIP_MAP = {
    "xiaoling": "xiaoling.zip",
    "xiaoshan": "xiaoshan.zip",
    "miaoyin": "miaoyin.zip",
    "xiaochan": "xiaochan.zip",
}

# 角色ID → 显示名称 + 风格描述
PERSONA_INFO = {
    "xiaoling": {"name": "小灵", "style": "热情专业"},
    "xiaoshan": {"name": "小山", "style": "沉稳博学"},
    "miaoyin": {"name": "妙音", "style": "优雅灵动"},
    "xiaochan": {"name": "小禅", "style": "禅意智慧"},
}

_active_persona = "miaoyin"  # 默认妙音


def get_active_persona() -> dict:
    """获取当前激活的数字人角色信息"""
    return PERSONA_INFO.get(_active_persona, PERSONA_INFO["miaoyin"])

OAC_LAM_SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..",
                                    "OpenAvatarChat", "lam_samples")
OAC_LAM_SAMPLES_DIR = os.path.abspath(OAC_LAM_SAMPLES_DIR)


class PersonaSwitchRequest(BaseModel):
    persona: str  # xiaoling, xiaoshan, miaoyin, xiaochan


class KnowledgeItem(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    category: str
    scenic_spot: str = "灵山胜境"


class DashboardData(BaseModel):
    today_visitors: int
    week_visitors: int
    hot_questions: list
    satisfaction_trend: list


# ===== 知识库管理 =====

@router.get("/knowledge")
async def list_knowledge(scenic_spot: str = "灵山胜境", page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    offset = (page - 1) * size
    total = db.query(KnowledgeDoc).count()
    items = db.query(KnowledgeDoc).order_by(KnowledgeDoc.updated_at.desc()).offset(offset).limit(size).all()
    return {
        "items": [{"id": str(doc.id), "title": doc.title, "content": doc.content, "category": doc.category, "scenic_spot": doc.scenic_spot, "updated_at": str(doc.updated_at)} for doc in items],
        "total": total, "page": page,
    }


@router.post("/knowledge")
async def create_knowledge(item: KnowledgeItem, db: Session = Depends(get_db)):
    doc = KnowledgeDoc(
        title=item.title, content=item.content, category=item.category,
        scenic_spot=item.scenic_spot, updated_at=datetime.datetime.now(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    # 向量化存入ChromaDB，使新增知识可被RAG检索
    try:
        collection = item.scenic_spot if item.scenic_spot != "灵山胜境" else "lingshan"
        add_documents(collection, [item.content], [{"source": item.title, "category": item.category}])
    except Exception:
        pass  # 向量化失败不影响SQLite写入
    return {"id": str(doc.id), "title": doc.title, "category": doc.category}


@router.put("/knowledge/{item_id}")
async def update_knowledge(item_id: int, item: KnowledgeItem, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDoc).filter(KnowledgeDoc.id == item_id).first()
    if not doc:
        return {"error": "条目不存在"}
    doc.title = item.title
    doc.content = item.content
    doc.category = item.category
    doc.scenic_spot = item.scenic_spot
    doc.updated_at = datetime.datetime.now()
    db.commit()
    return {"id": str(doc.id), "title": doc.title}


@router.delete("/knowledge/{item_id}")
async def delete_knowledge(item_id: int, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDoc).filter(KnowledgeDoc.id == item_id).first()
    if doc:
        db.delete(doc)
        db.commit()
    return {"deleted": item_id}


# ===== 导入示例资料 =====

@router.post("/import-demo")
async def import_demo_data(db: Session = Depends(get_db)):
    """解析示范景区公开资料包中的docx文件，导入知识库+向量化"""
    imported = 0
    try:
        from docx import Document
    except ImportError:
        return {"status": "error", "error": "后端缺少python-docx库"}

    # 1. 导入结构化数据集
    struct_file = os.path.join(DEMO_DATA_DIR, "灵山胜境 景点结构化数据集.docx")
    if os.path.exists(struct_file):
        try:
            doc = Document(struct_file)
            for table in doc.tables:
                if not table.rows:
                    continue
                header = [c.text.strip() for c in table.rows[0].cells]
                # 找到关键列索引
                col_map = {}
                for idx, h in enumerate(header):
                    for key in ["景区名称", "景点名称", "景点位置", "外观", "核心功能", "文化内涵", "详细介绍", "最佳打卡点", "开放", "备注"]:
                        if key in h and key not in col_map:
                            col_map[key] = idx
                # at minimum need 景点名称 and some content
                name_idx = col_map.get("景点名称")
                if name_idx is None:
                    continue
                scenic_idx = col_map.get("景区名称", name_idx)

                for row in table.rows[1:]:
                    cells = [c.text.strip() for c in row.cells]
                    if len(cells) <= name_idx or not cells[name_idx]:
                        continue
                    name = cells[name_idx]
                    scenic = cells[scenic_idx] if scenic_idx < len(cells) else "灵山胜境"
                    # 组装内容
                    parts = []
                    for key, ci in col_map.items():
                        if ci < len(cells) and cells[ci] and key not in ("景区名称", "景点名称"):
                            parts.append(f"【{key}】{cells[ci]}")
                    content = "\n".join(parts)
                    if not content:
                        content = name

                    # 写入SQLite（避免重复标题）
                    existing = db.query(KnowledgeDoc).filter(KnowledgeDoc.title == name).first()
                    if not existing:
                        db.add(KnowledgeDoc(
                            title=name, content=content[:5000], category="景点讲解",
                            scenic_spot=scenic, updated_at=datetime.datetime.now(),
                        ))
                        db.commit()
                    # 向量化
                    try:
                        add_documents("lingshan", [content], [{"source": name, "category": "景点讲解"}])
                    except Exception:
                        pass
                    imported += 1
        except Exception as e:
            return {"status": "error", "error": f"解析结构化数据集失败: {str(e)}"}

    # 2. 导入综合指南
    guide_file = os.path.join(DEMO_DATA_DIR, "灵山胜境：历史、文化、景点特色与个性化游览指南.docx")
    if os.path.exists(guide_file):
        try:
            doc = Document(guide_file)
            current_title = ""
            current_text = ""

            def flush_section():
                nonlocal current_title, current_text, imported
                if current_title and current_text.strip():
                    existing = db.query(KnowledgeDoc).filter(KnowledgeDoc.title == current_title).first()
                    if not existing:
                        db.add(KnowledgeDoc(
                            title=current_title, content=current_text.strip()[:5000],
                            category="文史资料", scenic_spot="灵山胜境",
                            updated_at=datetime.datetime.now(),
                        ))
                        db.commit()
                    try:
                        add_documents("lingshan", [current_text.strip()], [{"source": current_title, "category": "文史资料"}])
                    except Exception:
                        pass
                    imported += 1
                current_title = ""
                current_text = ""

            for p in doc.paragraphs:
                txt = p.text.strip()
                if not txt:
                    continue
                # 检测章节标题（短文本且以中文开头）
                is_heading = False
                if p.style and p.style.name and "Heading" in p.style.name:
                    is_heading = True
                elif len(txt) <= 25 and not txt.endswith("。") and not txt.endswith("）"):
                    is_heading = True

                if is_heading and not current_text:
                    current_title = txt
                elif is_heading and current_text:
                    flush_section()
                    current_title = txt
                else:
                    current_text += txt + "\n"

            flush_section()  # 最后一段
        except Exception as e:
            # 指南文件导入失败不阻断整体结果
            pass

    return {"status": "ok", "imported": imported}


# ===== 数字人形象管理 =====

@router.get("/digital-humans")
async def list_digital_humans():
    """返回真实角色列表 + 当前活跃角色"""
    current_zip = os.path.join(OAC_LAM_SAMPLES_DIR, "current.zip")
    active_persona = ""
    if os.path.exists(current_zip):
        current_md5 = hashlib.md5(open(current_zip, "rb").read()).hexdigest()
        for pid, zip_name in PERSONA_ZIP_MAP.items():
            zip_path = os.path.join(OAC_LAM_SAMPLES_DIR, zip_name)
            if os.path.exists(zip_path):
                if hashlib.md5(open(zip_path, "rb").read()).hexdigest() == current_md5:
                    active_persona = pid
                    break

    personas = [
        {"id": "xiaoling", "name": "小灵", "role": "热情导游", "style": "活泼亲切", "voice": "zh-CN-XiaoxiaoNeural", "emoji": "🌸", "color": "#e88b7e"},
        {"id": "xiaoshan", "name": "小山", "role": "博学导游", "style": "渊博儒雅", "voice": "zh-CN-YunxiNeural", "emoji": "🏔️", "color": "#8b5e3c"},
        {"id": "miaoyin", "name": "妙音", "role": "艺术导游", "style": "古风雅致", "voice": "zh-CN-XiaoyiNeural", "emoji": "🎵", "color": "#2d8a7b"},
        {"id": "xiaochan", "name": "小禅", "role": "禅修导游", "style": "淡泊宁静", "voice": "zh-CN-YunjianNeural", "emoji": "🧘", "color": "#6b8cc4"},
    ]
    return {"humans": personas, "active": active_persona}


@router.put("/digital-humans/{human_id}")
async def update_digital_human(human_id: str, config: dict = None):
    """激活指定角色"""
    if human_id in PERSONA_ZIP_MAP:
        source = os.path.join(OAC_LAM_SAMPLES_DIR, PERSONA_ZIP_MAP[human_id])
        target = os.path.join(OAC_LAM_SAMPLES_DIR, "current.zip")
        if os.path.exists(source):
            shutil.copy2(source, target)
            return {"success": True, "active": human_id}
    return {"success": False, "error": f"未知角色: {human_id}"}


# ===== 数字人角色切换 =====

@router.post("/switch-persona")
async def switch_persona(req: PersonaSwitchRequest):
    """切换数字人形象 - 仅替换ZIP文件，OAC下次加载会话时自动使用新形象"""
    global _active_persona
    persona = req.persona
    if persona not in PERSONA_ZIP_MAP:
        return {"success": False, "error": f"未知角色: {persona}"}

    zip_name = PERSONA_ZIP_MAP[persona]
    source = os.path.join(OAC_LAM_SAMPLES_DIR, zip_name)
    target = os.path.join(OAC_LAM_SAMPLES_DIR, "current.zip")

    if not os.path.exists(source):
        return {"success": False, "error": f"角色文件不存在: {zip_name}"}

    try:
        shutil.copy2(source, target)
        _active_persona = persona
        info = PERSONA_INFO.get(persona, PERSONA_INFO["miaoyin"])
        set_active_persona(info["name"], info["style"])  # 同步 rag.py 提示词角色身份
        return {"success": True, "persona": persona}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ===== 数据大屏 =====

@router.get("/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    now = datetime.datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - datetime.timedelta(days=7)

    today_count = db.query(ChatRecord).filter(ChatRecord.created_at >= today_start).count()
    week_count = db.query(ChatRecord).filter(ChatRecord.created_at >= week_start).count()
    # 服务游客数：统计所有已注册用户（OAC数字人调用不携带token，故从users表统计）
    from app.db.database import User
    today_tourists = db.query(User).count()
    week_tourists = today_tourists  # 累计注册用户数

    # 今日热门问题Top5
    hot = (
        db.query(ChatRecord.user_input, func.count(ChatRecord.id).label("cnt"))
        .filter(ChatRecord.created_at >= today_start)
        .group_by(ChatRecord.user_input)
        .order_by(func.count(ChatRecord.id).desc())
        .limit(5)
        .all()
    )
    hot_questions = [{"question": q[0][:50], "count": q[1]} for q in hot]

    # 最近7天每日服务量 (单条SQL聚合查询)
    daily_rows = (
        db.query(func.date(ChatRecord.created_at).label("d"), func.count(ChatRecord.id))
        .filter(ChatRecord.created_at >= week_start)
        .group_by(func.date(ChatRecord.created_at))
        .order_by("d")
        .all()
    )
    daily_map = {str(row[0]): row[1] for row in daily_rows}
    daily = []
    for i in range(6, -1, -1):
        day = today_start - datetime.timedelta(days=i)
        key = day.strftime("%Y-%m-%d")
        daily.append({"date": day.strftime("%m/%d"), "count": daily_map.get(key, 0)})

    total_questions = db.query(ChatRecord).count()

    return {
        "today_visitors": today_count,
        "week_visitors": week_count,
        "today_tourists": today_tourists,
        "week_tourists": week_tourists,
        "hot_questions": hot_questions,
        "daily_trend": daily,
        "total_questions": total_questions,
    }


# ===== 游客列表 =====

@router.get("/tourists")
async def list_tourists(db: Session = Depends(get_db)):
    """返回全部已注册游客列表（含对话统计数据）"""
    from app.db.database import User
    users = db.query(User).order_by(User.created_at.desc()).all()
    tourists = []
    for user in users:
        msg_count = db.query(func.count(ChatRecord.id)).filter(
            ChatRecord.user_id == user.id
        ).scalar() or 0
        last_active_row = db.query(func.max(ChatRecord.created_at)).filter(
            ChatRecord.user_id == user.id
        ).scalar()
        tourists.append({
            "user_id": user.id,
            "phone": (user.phone[:3] + "****" + user.phone[-4:]) if user.phone else "未知",
            "nickname": user.nickname or "未知",
            "msg_count": msg_count,
            "last_active": str(last_active_row) if last_active_row else str(user.created_at),
        })
    return {"tourists": tourists}


# ===== 游客反馈 =====

class FeedbackRequest(BaseModel):
    rating: int  # 1=点赞, -1=踩
    question: str = ""


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    fb = Feedback(rating=req.rating, question=req.question[:200])
    db.add(fb)
    db.commit()
    return {"success": True}


# ===== 游客反馈报告 =====

@router.get("/reports")
async def get_reports(db: Session = Depends(get_db)):
    total_feedback = db.query(Feedback).count()
    likes = db.query(Feedback).filter(Feedback.rating == 1).count()
    dislikes = db.query(Feedback).filter(Feedback.rating == -1).count()
    satisfaction = round(likes / total_feedback * 100, 1) if total_feedback > 0 else 0

    # 最近反馈列表
    recent = (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .limit(20)
        .all()
    )
    recent_list = [{
        "rating": f.rating,
        "question": f.question[:60],
        "time": str(f.created_at),
    } for f in recent]

    # 每日满意度趋势 (单条SQL聚合查询)
    now = datetime.datetime.now()
    week_start = (now - datetime.timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    daily_rows = (
        db.query(
            func.date(Feedback.created_at).label("d"),
            func.count(Feedback.id).label("total"),
            func.sum(case((Feedback.rating == 1, 1), else_=0)).label("likes"),
        )
        .filter(Feedback.created_at >= week_start)
        .group_by(func.date(Feedback.created_at))
        .order_by("d")
        .all()
    )
    daily_map = {str(row[0]): {"total": row[1], "likes": row[2] or 0} for row in daily_rows}
    daily = []
    for i in range(6, -1, -1):
        day = now - datetime.timedelta(days=i)
        key = day.strftime("%Y-%m-%d")
        info = daily_map.get(key, {"total": 0, "likes": 0})
        daily.append({
            "date": day.strftime("%m/%d"),
            "rate": round(info["likes"] / info["total"] * 100, 1) if info["total"] > 0 else 0,
        })

    return {
        "total_feedback": total_feedback,
        "likes": likes,
        "dislikes": dislikes,
        "satisfaction": satisfaction,
        "recent": recent_list,
        "daily_trend": daily,
    }
