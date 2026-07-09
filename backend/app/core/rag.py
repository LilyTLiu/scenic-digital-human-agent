"""
RAG - Retrieval Augmented Generation
文档加载 → 文本切片 → 向量化 → 存入ChromaDB → 检索 → 增强生成
"""
import os
# 必须在导入 sentence-transformers 之前设置，否则 huggingface_hub 会尝试联网
# 模型已缓存在 ~/.cache/huggingface/，日常使用无需联网
os.environ.setdefault("HF_HUB_OFFLINE", "1")

from langchain_text_splitters import RecursiveCharacterTextSplitter
from chromadb import PersistentClient
from chromadb.utils import embedding_functions

KB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "knowledge_base")
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db")

# 默认嵌入函数（使用开源sentence-transformers）
default_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="shibing624/text2vec-base-chinese"
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", "。", "！", "？", "，", " ", ""],
)


def get_chroma_client():
    os.makedirs(CHROMA_PATH, exist_ok=True)
    return PersistentClient(path=CHROMA_PATH)


def create_knowledge_base(collection_name: str):
    """创建或获取知识库集合"""
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=default_ef,
    )
    return collection


def add_documents(collection_name: str, documents: list[str], metadatas: list[dict] = None):
    """向知识库添加文档"""
    collection = create_knowledge_base(collection_name)
    chunks = []
    chunk_metadatas = []
    for i, doc in enumerate(documents):
        splits = text_splitter.split_text(doc)
        chunks.extend(splits)
        base_meta = metadatas[i] if metadatas else {}
        for j, _ in enumerate(splits):
            chunk_metadatas.append({**base_meta, "chunk_index": j})

    ids = [f"chunk_{i}" for i in range(len(chunks))]
    if chunks:
        collection.add(documents=chunks, metadatas=chunk_metadatas, ids=ids)
    return len(chunks)


def search(collection_name: str, query: str, top_k: int = 5):
    """检索相关文档片段"""
    collection = create_knowledge_base(collection_name)
    results = collection.query(query_texts=[query], n_results=top_k)
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    return [
        {"content": doc, "metadata": meta, "score": 1 - dist if dist else 1.0}
        for doc, meta, dist in zip(docs, metas, distances)
    ]


def delete_documents(collection_name: str, doc_ids: list[str]) -> int:
    """从知识库删除指定文档片段"""
    if not doc_ids:
        return 0
    collection = create_knowledge_base(collection_name)
    collection.delete(ids=doc_ids)
    return len(doc_ids)


def update_document(
    collection_name: str,
    old_ids: list[str],
    documents: list[str],
    metadatas: list[dict] = None,
) -> int:
    """更新文档：删除旧片段 → 添加新片段"""
    delete_documents(collection_name, old_ids)
    return add_documents(collection_name, documents, metadatas)


def build_prompt(query: str, context_docs: list[dict], scenic_spot: str, history: list[dict] = None) -> str:
    """构建带知识上下文和对话历史的提示词"""
    context_text = "\n\n---\n\n".join(
        f"[参考片段 {i+1}]\n{doc['content']}"
        for i, doc in enumerate(context_docs)
    )

    # 对话历史
    history_section = ""
    if history and len(history) > 0:
        history_lines = []
        for h in history:
            role_label = "游客" if h["role"] == "user" else "AI导游"
            history_lines.append(f"{role_label}：{h['content']}")
        history_section = "\n\n---\n\n【对话历史】\n" + "\n".join(history_lines)

    return f"""你是一位对{scenic_spot}景区了如指掌的专业AI导游。请根据以下知识库内容，用亲切、专业、热情的语气回答游客的问题。
{history_section}

【知识库内容】
{context_text}

【游客问题】
{query}

【回答要求】
1. 仔细阅读所有参考片段和对话历史（如果有），不要遗漏任何信息——演出时间、开放时间等实用信息可能藏在片段末尾
2. 如果游客的提问与对话历史相关（如"它"、"那个"等指代），请结合历史上下文理解
3. 如果游客问的是时间、票价、演出等实用信息，优先从参考片段的"演艺/开放信息"或"游玩亮点"字段中查找
4. 准确回答，不编造知识库中没有的信息
5. 如果知识库中确实搜索不到相关信息，诚实告知游客"暂时没有查到这方面的详细信息"，并建议游客关注景区官方小程序或咨询现场工作人员
6. 语气亲切自然，像一位热情的导游在给游客讲解
7. 回答中可适当引用知识库中的具体数据、历史典故、文化内涵等内容
"""
