FROM python:3.11-slim

WORKDIR /app

# 系统依赖（ChromaDB 需要 C++ 运行时，faster-whisper 需要 libgomp）
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 预下载 sentence-transformers 模型（构建时下载，避免启动时超时）
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
