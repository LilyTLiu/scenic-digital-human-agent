# Backend Configuration
import os
from pathlib import Path

# 自动加载 .env 文件（无需每次手动设置环境变量）
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

class Settings:
    APP_NAME = "AI数字人智能导游系统"
    VERSION = "0.1.0"

    # DeepSeek API
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
    DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

    # Whisper
    WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

    # TTS
    TTS_VOICE = os.getenv("TTS_VOICE", "zh-CN-XiaoxiaoNeural")

    # ChromaDB
    CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_db")

    # Upload
    MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB


settings = Settings()
