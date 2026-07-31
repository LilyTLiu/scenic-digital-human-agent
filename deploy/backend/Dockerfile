# ══════════════════════════════════════════════════════════════
# 后端：Python 3.11 + FastAPI
# 针对大陆服务器做了国内镜像加速（apt / pip / HuggingFace）
# ══════════════════════════════════════════════════════════════

FROM python:3.11-slim

WORKDIR /app

# 系统依赖（ChromaDB 需要 C++ 运行时，faster-whisper 需要 libgomp）
# apt 使用国内镜像（大陆服务器必需），兼容两种源文件格式
RUN (sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list 2>/dev/null || true) \
 && (sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || true) \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# pip 使用国内镜像（大陆服务器必需）
RUN pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt

# 预下载 embedding 模型（构建时下载，避免启动时超时）
# HuggingFace 使用国内镜像（大陆服务器必需）
ENV HF_ENDPOINT=https://hf-mirror.com
RUN python -c "\
from chromadb.utils import embedding_functions; \
ef = embedding_functions.SentenceTransformerEmbeddingFunction( \
    model_name='shibing624/text2vec-base-chinese'); \
print('Model pre-downloaded successfully')"

COPY . .

# 确保数据目录和 DB 目录存在
RUN mkdir -p /app/chroma_db /app/data

EXPOSE 8000

CMD ["uvicorn", "app.app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
