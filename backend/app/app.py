from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, voice, admin, upload, user
from app.db.database import init_db

init_db()

app = FastAPI(
    title="AI数字人智能导游系统",
    description="中国软件杯2026 A5 - 基于多模态大模型的智慧景区导览系统",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["对话"])
app.include_router(voice.router, prefix="/api/voice", tags=["语音"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理"])
app.include_router(upload.router, prefix="/api/upload", tags=["上传"])
app.include_router(user.router, prefix="/api/user", tags=["用户"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "AI数字人智能导游系统"}
