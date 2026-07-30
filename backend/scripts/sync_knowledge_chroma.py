"""
Rebuild ChromaDB collections from the SQLite knowledge_docs table.

Use this when the admin knowledge list contains entries that RAG cannot find.
It keeps SQLite as the source of truth and rewrites each scenic spot collection.
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.rag import add_documents, create_knowledge_base, reset_collection
from app.db.database import KnowledgeDoc, ScenicSpot, SessionLocal, get_collection_name


def sync_collection(db, scenic_name: str) -> int:
    collection = get_collection_name(scenic_name, db)
    reset_collection(collection)

    scenic_names = {scenic_name, collection}
    spot = db.query(ScenicSpot).filter(
        (ScenicSpot.name == scenic_name) | (ScenicSpot.slug == scenic_name)
    ).first()
    if spot:
        scenic_names.update([spot.name, spot.slug])

    docs = (
        db.query(KnowledgeDoc)
        .filter(KnowledgeDoc.scenic_spot.in_(list(scenic_names)))
        .order_by(KnowledgeDoc.id.asc())
        .all()
    )

    synced = 0
    for doc in docs:
        text = f"景点名称：{doc.title}\n{doc.content or ''}".strip()
        if not text:
            doc.chroma_ids = "[]"
            continue

        count = add_documents(
            collection,
            [text],
            [{
                "source": doc.title or f"knowledge-{doc.id}",
                "type": "kb_entry",
                "kb_id": doc.id,
                "category": doc.category or "",
            }],
        )
        coll = create_knowledge_base(collection)
        all_ids = coll.get()["ids"]
        doc.chroma_ids = json.dumps(all_ids[-count:] if count else [], ensure_ascii=False)
        synced += count

    db.commit()
    return synced


def main():
    scenic_name = sys.argv[1] if len(sys.argv) > 1 else "灵山胜境"
    db = SessionLocal()
    try:
        chunks = sync_collection(db, scenic_name)
        print(f"Synced {chunks} chunks for {scenic_name}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
