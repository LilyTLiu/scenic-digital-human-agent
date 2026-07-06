from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
import datetime
from app.db.database import get_db, KnowledgeDoc
from app.core.rag import add_documents

router = APIRouter()

COLLECTION_NAME = "lingshan_knowledge"


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    scenic_spot: str = Form("灵山胜境"),
    category: str = Form("通用"),
    db: Session = Depends(get_db),
):
    """上传文档 → 解析文本 → 切片向量化 → 存入ChromaDB + SQLite"""
    try:
        content_bytes = await file.read()
    except Exception:
        return {"status": "error", "error": "无法读取文件"}

    filename = file.filename or "unknown"
    text = ""

    # 解析文件内容
    if filename.endswith('.txt'):
        try:
            text = content_bytes.decode('utf-8')
        except UnicodeDecodeError:
            text = content_bytes.decode('gbk', errors='replace')
    elif filename.endswith('.docx'):
        try:
            from io import BytesIO
            from docx import Document
            doc = Document(BytesIO(content_bytes))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except ImportError:
            return {"status": "error", "error": "后端缺少python-docx库，请运行: pip install python-docx"}
        except Exception as e:
            return {"status": "error", "error": f"docx解析失败: {str(e)}"}
    else:
        return {"status": "error", "error": f"不支持的文件格式: {filename}，仅支持 .txt 和 .docx"}

    if not text.strip():
        return {"status": "error", "error": "文件内容为空"}

    # 向量化存入ChromaDB
    try:
        chunk_count = add_documents(COLLECTION_NAME, [text], [{"source": filename}])
    except Exception as e:
        return {"status": "error", "error": f"向量化失败: {str(e)}"}

    # 同时写入知识库表
    title = filename.rsplit('.', 1)[0]
    kb_doc = KnowledgeDoc(
        title=title, content=text[:2000], category=category,
        scenic_spot=scenic_spot, updated_at=datetime.datetime.now(),
    )
    db.add(kb_doc)
    db.commit()

    return {
        "filename": filename,
        "size": len(content_bytes),
        "status": "indexed",
        "chunks": chunk_count,
        "scenic_spot": scenic_spot,
    }
