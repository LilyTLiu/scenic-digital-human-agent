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


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    Base.metadata.create_all(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
