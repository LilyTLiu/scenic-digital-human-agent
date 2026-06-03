from fastapi import APIRouter, UploadFile, File

router = APIRouter()


@router.post("/document")
async def upload_document(file: UploadFile = File(...), scenic_spot: str = "灵山胜境"):
    # TODO: 文档解析 → 切片 → 向量化 → 存入ChromaDB
    return {
        "filename": file.filename,
        "size": file.size or 0,
        "status": "uploaded",
        "scenic_spot": scenic_spot,
    }
