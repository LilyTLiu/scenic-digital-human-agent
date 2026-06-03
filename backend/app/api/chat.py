from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    scenic_spot: str = "灵山胜境"
    session_id: str = ""


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    references: list = []


@router.post("/send", response_model=ChatResponse)
async def send_message(req: ChatRequest):
    # TODO: 接入RAG + LLM
    return ChatResponse(
        reply=f"[{req.scenic_spot}] 收到您的问题，AI导游正在为您解答...",
        session_id=req.session_id or "session_001",
        references=[],
    )
