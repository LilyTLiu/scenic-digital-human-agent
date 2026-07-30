from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.rag import search, build_prompt
from app.core.llm import chat, chat_stream
from app.core.query_normalization import normalize_scenic_query
from app.db.database import get_db, ChatRecord, KnowledgeDoc, ScenicSpot, get_collection_name
import json
import traceback
import datetime
import uuid

router = APIRouter()

HISTORY_MAX = 10  # 多轮对话最多携带的历史轮数
KEYWORD_HIT_LIMIT = 4

QUERY_SYNONYMS = {
    "票价": ["门票", "价格", "票种", "优惠", "成人票", "半价票", "免票"],
    "门票": ["票价", "价格", "票种", "优惠", "成人票", "半价票", "免票"],
    "拈花": ["拈花湾", "禅意小镇"],
    "拈花湾": ["拈花", "禅意小镇"],
    "路线": ["游览路线", "路线规划", "推荐路线", "深度游", "轻松游", "全景游"],
    "半日游": ["路线", "轻松游", "4小时"],
    "亲子": ["路线", "亲子家庭路线", "轻松游"],
    "老人": ["路线", "轻松游", "观光车"],
    "老年": ["路线", "轻松游", "观光车"],
    "历史文化": ["路线", "历史文化爱好者路线", "深度游"],
    "自然风光": ["路线", "自然风光爱好者路线", "全景游"],
}

ROUTE_TERMS = ("路线", "游览", "行程", "怎么走", "半日游", "一日游", "亲子", "老人", "老年", "深度游", "轻松游", "全景游")


class ChatRequest(BaseModel):
    message: str
    scenic_spot: str = "灵山胜境"
    session_id: str = ""
    stream: bool = False


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    references: list = []


def _load_history(session_id: str, db: Session, limit: int = HISTORY_MAX) -> list[dict]:
    """加载指定会话的最近 N 轮对话历史"""
    if not session_id:
        return []
    rows = (
        db.query(ChatRecord)
        .filter(ChatRecord.session_id == session_id)
        .order_by(desc(ChatRecord.created_at))
        .limit(limit)
        .all()
    )
    # 按时间正序排列
    rows = list(reversed(rows))
    history = []
    for r in rows:
        history.append({"role": "user", "content": r.user_input})
        history.append({"role": "assistant", "content": r.ai_reply[:300]})  # 截断历史回复
    return history


def _save_record(session_id: str, scenic_spot: str, user_input: str, ai_reply: str, db: Session):
    """持久化对话记录到 SQLite"""
    try:
        record = ChatRecord(
            session_id=session_id,
            scenic_spot=scenic_spot,
            user_input=user_input,
            ai_reply=ai_reply,
            created_at=datetime.datetime.now(),
        )
        db.add(record)
        db.commit()
    except Exception:
        pass  # 记录失败不阻塞主流程


def _scenic_names(scenic_spot: str, db: Session) -> list[str]:
    """返回当前景区可能出现在数据库中的名称/slug，保证前端 slug 与后台中文名一致。"""
    names = {scenic_spot}
    spot = db.query(ScenicSpot).filter(
        (ScenicSpot.name == scenic_spot) | (ScenicSpot.slug == scenic_spot)
    ).first()
    if spot:
        names.update([spot.name, spot.slug])
    return [name for name in names if name]


def _candidate_scenics(message: str, scenic_spot: str, db: Session) -> list[str]:
    """Return scenic names that should be searched for this question."""
    candidates = []
    default_names = _scenic_names(scenic_spot, db)
    candidates.extend(default_names)

    spots = db.query(ScenicSpot).filter(ScenicSpot.enabled == 1).all()
    known_names = {(spot.name, spot.slug) for spot in spots}
    distinct_scenics = db.query(KnowledgeDoc.scenic_spot).distinct().all()
    for (name,) in distinct_scenics:
        if name and not any(name in pair for pair in known_names):
            known_names.add((name, ""))

    for name, slug in known_names:
        aliases = [name, slug]
        if name == "拈花湾禅意小镇":
            aliases.extend(["拈花湾", "拈花", "禅意小镇"])
        if name == "灵山胜境":
            aliases.extend(["灵山", "灵山景区"])
        if any(alias and alias in message for alias in aliases):
            candidates.extend(_scenic_names(name or slug, db))

    result = []
    for item in candidates:
        if item and item not in result:
            result.append(item)
    return result


def _query_terms(message: str) -> list[str]:
    """提取适合精确召回的中文关键词，优先保留景点名。"""
    text = message.strip()
    stop_words = [
        "请", "帮我", "为我", "介绍一下", "介绍", "讲解一下", "讲解", "一下",
        "什么是", "说说", "告诉我", "的", "吗", "呢", "？", "?", "，", ",",
    ]
    compact = text
    for word in stop_words:
        compact = compact.replace(word, "")
    terms = []
    for term in [compact, compact.replace("灵山", ""), text]:
        term = term.strip()
        if len(term) >= 2 and term not in terms:
            terms.append(term)
            terms.extend([syn for syn in QUERY_SYNONYMS.get(term, []) if syn not in terms])
    for key, synonyms in QUERY_SYNONYMS.items():
        if key in text:
            for term in [key, *synonyms]:
                if term not in terms:
                    terms.append(term)
    return terms


def _is_route_query(message: str) -> bool:
    return any(term in message for term in ROUTE_TERMS)


def _route_score(message: str, title: str, content: str) -> float:
    if not _is_route_query(message):
        return 0.0
    if "路线" not in title and "路线规划" not in content:
        return 0.0

    score = 0.9
    route_preferences = [
        (("亲子", "孩子", "家庭", "轻松", "4小时", "半日"), ("亲子", "轻松", "4小时")),
        (("自然", "风光", "全景", "5小时"), ("自然", "风光", "全景", "5小时")),
        (("历史", "文化", "深度", "6小时"), ("历史", "文化", "深度", "6小时")),
    ]
    for question_terms, title_terms in route_preferences:
        if any(term in message for term in question_terms) and any(term in title for term in title_terms):
            score = 1.0
            break
    return score


def _keyword_hits(message: str, scenic_spots: list[str], db: Session, limit: int = KEYWORD_HIT_LIMIT) -> list[dict]:
    """从 SQLite 知识表做精确/关键词召回，兜底 Chroma 漏索引的景点条目。"""
    docs = (
        db.query(KnowledgeDoc)
        .filter(KnowledgeDoc.scenic_spot.in_(scenic_spots))
        .all()
    )
    terms = _query_terms(message)
    hits = []
    for doc in docs:
        title = doc.title or ""
        content = doc.content or ""
        title_core = title.replace("灵山", "").strip()
        score = _route_score(message, title, content)
        if title and (title in message or message in title):
            score = max(score, 1.0)
        elif title_core and len(title_core) >= 2 and title_core in message:
            score = max(score, 0.96)
        else:
            matched_terms = [term for term in terms if term and (term in title or term in content)]
            if matched_terms:
                score = max(score, 0.78 + min(0.12, 0.03 * len(matched_terms)))
        if score:
            hits.append({
                "content": f"景点名称：{title}\n{content}",
                "metadata": {"source": title, "type": "keyword_kb", "kb_id": doc.id},
                "score": score,
            })
    hits.sort(key=lambda item: item["score"], reverse=True)
    return hits[:limit]


def _merge_results(primary: list[dict], secondary: list[dict], limit: int = 8) -> list[dict]:
    """合并精确召回与向量召回，按来源/内容去重。"""
    merged = []
    seen = set()
    for item in [*primary, *secondary]:
        meta = item.get("metadata", {}) or {}
        key = (
            meta.get("kb_id"),
            meta.get("source"),
            item.get("content", "")[:80],
        )
        if key in seen:
            continue
        seen.add(key)
        merged.append(item)
    return merged[:limit]


def _vector_hits(collections: list[str], message: str, db: Session, top_k: int = 8) -> list[dict]:
    hits = []
    searched = set()
    for scenic in collections:
        collection = get_collection_name(scenic, db)
        if collection in searched:
            continue
        searched.add(collection)
        try:
            hits.extend(search(collection, message, top_k=top_k))
        except Exception:
            continue
    return hits


def _route_notice_hits(message: str) -> list[dict]:
    if not _is_route_query(message):
        return []
    notices = []
    if any(term in message for term in ("老人", "老年")):
        notices.append({
            "content": "路线匹配说明：知识库中没有老人或老年游客专门路线。回答时必须先说明这一点，再推荐最接近的已有轻松路线，并结合观光车、休息和防滑等建议。",
            "metadata": {"source": "路线匹配说明", "type": "route_notice"},
            "score": 1.0,
        })
    if "半日" in message:
        notices.append({
            "content": "路线匹配说明：知识库中没有标题为半日游的专门路线。可推荐最接近半日时长的“亲子家庭路线（4小时轻松游）”，但需要说明这是按时长匹配的已有路线。",
            "metadata": {"source": "路线匹配说明", "type": "route_notice"},
            "score": 1.0,
        })
    return notices


@router.post("/send")
async def send_message(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        session_id = req.session_id or str(uuid.uuid4())[:8]
        message = normalize_scenic_query(req.message)
        scenic_targets = _candidate_scenics(message, req.scenic_spot, db)

        # 1. RAG检索
        vector_results = _vector_hits(scenic_targets, message, db, top_k=8)
        keyword_results = [*_route_notice_hits(message), *_keyword_hits(message, scenic_targets, db)]
        results = _merge_results(keyword_results, vector_results)
        # 2. 加载对话历史
        history = _load_history(session_id, db)
        # 3. 构建提示词（含RAG知识 + 对话历史）
        prompt = build_prompt(message, results, req.scenic_spot, history)
        # 4. 调用DeepSeek
        reply = await chat(prompt)
        # 5. 持久化
        _save_record(session_id, req.scenic_spot, message, reply, db)

        return ChatResponse(
            reply=reply,
            session_id=session_id,
            references=[
                {"content": r["content"][:200], "score": round(r["score"], 3),
                 "source": r.get("metadata", {}).get("source", "")}
                for r in results
            ],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"对话失败: {str(e)}")


@router.post("/stream")
async def send_message_stream(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        session_id = req.session_id or str(uuid.uuid4())[:8]
        message = normalize_scenic_query(req.message)
        scenic_targets = _candidate_scenics(message, req.scenic_spot, db)
        vector_results = _vector_hits(scenic_targets, message, db, top_k=8)
        keyword_results = [*_route_notice_hits(message), *_keyword_hits(message, scenic_targets, db)]
        results = _merge_results(keyword_results, vector_results)
        history = _load_history(session_id, db)
        prompt = build_prompt(message, results, req.scenic_spot, history)

        # 收集完整回复用于持久化
        full_reply_parts = []

        async def generate():
            async for token in chat_stream(prompt):
                full_reply_parts.append(token)
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            # 流式结束后持久化
            full_reply = "".join(full_reply_parts)
            _save_record(session_id, req.scenic_spot, message, full_reply, db)

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"流式对话失败: {str(e)}")


