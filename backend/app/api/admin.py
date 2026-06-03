from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


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
async def list_knowledge(scenic_spot: str = "灵山胜境", page: int = 1, size: int = 20):
    return {"items": [], "total": 0, "page": page}


@router.post("/knowledge")
async def create_knowledge(item: KnowledgeItem):
    return {"id": "kb_001", **item.model_dump()}


@router.put("/knowledge/{item_id}")
async def update_knowledge(item_id: str, item: KnowledgeItem):
    return {"id": item_id, **item.model_dump()}


@router.delete("/knowledge/{item_id}")
async def delete_knowledge(item_id: str):
    return {"deleted": item_id}


# ===== 数字人形象管理 =====

@router.get("/digital-humans")
async def list_digital_humans():
    return {
        "humans": [
            {"id": "dh_001", "name": "灵山小导游", "avatar": "", "voice": "default"},
        ]
    }


@router.put("/digital-humans/{human_id}")
async def update_digital_human(human_id: str, config: dict):
    return {"id": human_id, **config}


# ===== 数据大屏 =====

@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard():
    return DashboardData(
        today_visitors=0,
        week_visitors=0,
        hot_questions=[],
        satisfaction_trend=[],
    )


# ===== 游客反馈报告 =====

@router.get("/reports")
async def get_reports():
    return {"reports": []}
