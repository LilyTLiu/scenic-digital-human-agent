from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.rag import search, build_prompt
from app.core.llm import chat, chat_stream
from app.db.database import get_db, ChatRecord, get_collection_name
import json
import traceback
import datetime
import uuid

router = APIRouter()

HISTORY_MAX = 10  # 多轮对话最多携带的历史轮数


class ChatRequest(BaseModel):
    message: str
    scenic_spot: str = "灵山胜境"
    session_id: str = ""
    stream: bool = False
    persona_name: str = ""
    persona_role: str = ""
    persona_style: str = ""


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


@router.post("/send")
async def send_message(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        collection = get_collection_name(req.scenic_spot, db)
        session_id = req.session_id or str(uuid.uuid4())[:8]

        # 1. RAG检索
        results = search(collection, req.message, top_k=5)
        # 2. 加载对话历史
        history = _load_history(session_id, db)
        # 3. 构建提示词（含RAG知识 + 对话历史 + 角色身份）
        prompt = build_prompt(
            req.message, results, req.scenic_spot, history,
            persona_name=req.persona_name or None,
            persona_role=req.persona_role or None,
            persona_style=req.persona_style or None,
        )
        # 4. 调用DeepSeek
        reply = await chat(prompt)
        # 5. 持久化
        _save_record(session_id, req.scenic_spot, req.message, reply, db)

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
        collection = get_collection_name(req.scenic_spot, db)
        session_id = req.session_id or str(uuid.uuid4())[:8]
        results = search(collection, req.message, top_k=5)
        history = _load_history(session_id, db)
        prompt = build_prompt(
            req.message, results, req.scenic_spot, history,
            persona_name=req.persona_name or None,
            persona_role=req.persona_role or None,
            persona_style=req.persona_style or None,
        )

        # 收集完整回复用于持久化
        full_reply_parts = []

        async def generate():
            async for token in chat_stream(prompt):
                full_reply_parts.append(token)
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            # 流式结束后持久化
            full_reply = "".join(full_reply_parts)
            _save_record(session_id, req.scenic_spot, req.message, full_reply, db)

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


