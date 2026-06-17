from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.rag import search, build_prompt
from app.core.llm import chat, chat_stream
import json
import traceback

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
