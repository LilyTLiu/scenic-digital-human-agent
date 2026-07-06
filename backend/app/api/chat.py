from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.rag import search, build_prompt
from app.core.llm import chat, chat_stream, chat_with_system
from app.db.database import get_db, ChatRecord, User
import json


def _resolve_user(token: str | None) -> int | None:
    if not token:
        return None
    try:
        from app.db.database import SessionLocal
        dbs = SessionLocal()
        try:
            user = dbs.query(User).filter(User.token == token).first()
            return user.id if user else None
        finally:
            dbs.close()
    except Exception:
        return None
import traceback
import time
import uuid
import datetime

router = APIRouter()

# 景区名 → ChromaDB 集合名映射
SCENIC_SPOT_MAP = {
    "灵山胜境": "lingshan",
    "灵山": "lingshan",
    "lingshan": "lingshan",
}


class ChatRequest(BaseModel):
    message: str
    scenic_spot: str = "灵山胜境"
    session_id: str = ""
    stream: bool = False
    token: str = ""


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    references: list = []


@router.post("/send")
async def send_message(req: ChatRequest):
    try:
        collection = SCENIC_SPOT_MAP.get(req.scenic_spot, req.scenic_spot)
        # 1. RAG检索
        results = search(collection, req.message, top_k=5)
        # 2. 构建提示词
        prompt = build_prompt(req.message, results, req.scenic_spot)
        # 3. 调用DeepSeek
        reply = await chat(prompt)

        # 4. 记录对话
        from app.db.database import SessionLocal
        dbs = SessionLocal()
        try:
            dbs.add(ChatRecord(
                session_id=req.session_id or "web",
                user_id=_resolve_user(req.token or None),
                scenic_spot=req.scenic_spot,
                user_input=req.message,
                ai_reply=reply,
            ))
            dbs.commit()
        finally:
            dbs.close()

        return ChatResponse(
            reply=reply,
            session_id=req.session_id or "session_001",
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
async def send_message_stream(req: ChatRequest):
    try:
        collection = SCENIC_SPOT_MAP.get(req.scenic_spot, req.scenic_spot)
        results = search(collection, req.message, top_k=5)
        prompt = build_prompt(req.message, results, req.scenic_spot)

        async def generate():
            async for token in chat_stream(prompt):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

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


# ========== OpenAI 兼容端点 (供 OpenAvatarChat 调用) ==========

class OpenAIMessage(BaseModel):
    role: str
    content: str

class OpenAIRequest(BaseModel):
    model: str = "deepseek-chat"
    messages: list[OpenAIMessage]
    stream: bool = False
    temperature: float = 0.7

@router.post("/v1/chat/completions")
async def openai_compatible(req: OpenAIRequest):
    """OpenAI兼容端点 - OpenAvatarChat的数字人大脑"""
    try:
        user_msg = req.messages[-1].content if req.messages else "你好"

        # RAG检索
        results = search("lingshan", user_msg, top_k=5)

        # 构建导游提示词
        system_prompt = build_prompt(user_msg, results, "灵山胜境")

        # 提取对话历史（不含最后一条用户消息）
        history = [
            {"role": m.role, "content": m.content}
            for m in req.messages[:-1]
        ]

        # 调用 DeepSeek
        reply = await chat_with_system(
            system_prompt=system_prompt,
            user_message=user_msg,
            history=history,
            temperature=req.temperature,
        )

        # 记录对话
        from app.db.database import SessionLocal
        dbs = SessionLocal()
        try:
            dbs.add(ChatRecord(
                session_id="oac",
                scenic_spot="灵山胜境",
                user_input=user_msg,
                ai_reply=reply,
            ))
            dbs.commit()
        finally:
            dbs.close()

        return {
            "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": req.model,
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": reply},
                "finish_reason": "stop",
            }],
            "usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            },
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM调用失败: {str(e)}")
