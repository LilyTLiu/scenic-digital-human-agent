# Backend Configuration
import os

class Settings:
    APP_NAME = "AI数字人智能导游系统"
    VERSION = "0.1.0"

    # LLM
    LLM_API_KEY = os.getenv("LLM_API_KEY", "")
    LLM_API_BASE = os.getenv("LLM_API_BASE", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    LLM_MODEL = os.getenv("LLM_MODEL", "qwen-plus")

    # Whisper
    WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

    # TTS
    TTS_VOICE = os.getenv("TTS_VOICE", "zh-CN-XiaoxiaoNeural")

    # ChromaDB
    CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db")

    # Upload
    MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB


settings = Settings()
