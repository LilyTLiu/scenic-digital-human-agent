# 数据库模型
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data.db")
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class ChatRecord(Base):
    """对话记录"""
    __tablename__ = "chat_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64))
    user_id = Column(Integer, nullable=True)
    scenic_spot = Column(String(128))
    user_input = Column(Text)
    ai_reply = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.now)


class KnowledgeDoc(Base):
    """知识文档"""
    __tablename__ = "knowledge_docs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(256))
    content = Column(Text)
    category = Column(String(64))
    scenic_spot = Column(String(128))
    chroma_ids = Column(Text, default="[]")  # JSON: ChromaDB 片段 ID
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now)


class DigitalHumanConfig(Base):
    """数字人配置"""
    __tablename__ = "digital_human_configs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128))
    scenic_spot = Column(String(128))
    avatar = Column(String(512))
    voice = Column(String(64))
    model_config = Column(Text)  # JSON
    created_at = Column(DateTime, default=datetime.datetime.now)


class User(Base):
    """用户 - 手机号登录"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(20), unique=True, nullable=False)
    nickname = Column(String(64))
    avatar = Column(String(512))
    token = Column(String(128), unique=True)
    created_at = Column(DateTime, default=datetime.datetime.now)


class UserPreference(Base):
    """用户偏好"""
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    interests = Column(Text)  # JSON: ["佛教文化","建筑艺术"]
    travel_style = Column(String(32))  # 深度游/轻松游/亲子游
    group_type = Column(String(32))  # 独自/情侣/家庭/朋友
    updated_at = Column(DateTime, default=datetime.datetime.now)


class Feedback(Base):
    """游客满意度反馈"""
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    rating = Column(Integer)  # 1=点赞, -1=踩
    question = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.now)


class ScenicSpot(Base):
    """景区配置"""
    __tablename__ = "scenic_spots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), unique=True, nullable=False)
    slug = Column(String(64), unique=True, nullable=False)  # ChromaDB 集合名
    description = Column(Text, default="")
    enabled = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.now)


def get_collection_name(scenic_spot: str, db) -> str:
    """根据景区名/slug 获取 ChromaDB 集合名"""
    spot = db.query(ScenicSpot).filter(
        (ScenicSpot.name == scenic_spot) | (ScenicSpot.slug == scenic_spot)
    ).first()
    return spot.slug if (spot and spot.enabled) else scenic_spot


def seed_default_scenic_spot():
    """首次启动时自动创建灵山胜境"""
    db = SessionLocal()
    try:
        if not db.query(ScenicSpot).filter(ScenicSpot.slug == "lingshan").first():
            db.add(ScenicSpot(name="灵山胜境", slug="lingshan",
                description="无锡灵山胜境，国家5A级旅游景区", enabled=1))
            db.commit()
    finally:
        db.close()


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    Base.metadata.create_all(engine)
    seed_default_scenic_spot()
    # 兼容旧表：为 chat_records 添加 user_id 列（若不存在）
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE chat_records ADD COLUMN user_id INTEGER"))
            conn.commit()
    except Exception:
        pass  # 列已存在则忽略


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 启动时自动建表（仅创建不存在的表，不影响已有数据）
init_db()
