"""
数据库 单元测试
覆盖: 表创建、模型定义、CRUD操作
"""
import os
import sys
import pytest

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))


class TestDatabaseModels:
    """数据库模型测试"""

    def test_create_all_tables(self, db_session):
        """TC-DB-001: 验证所有表存在"""
        from sqlalchemy import inspect
        inspector = inspect(db_session.bind)
        tables = inspector.get_table_names()
        expected_tables = {
            "chat_records",
            "knowledge_docs",
            "digital_human_configs",
            "users",
            "user_preferences",
            "feedbacks",
        }
        for t in expected_tables:
            assert t in tables, f"表 {t} 不存在"

    def test_chat_record_crud(self, db_session):
        """对话记录 CRUD"""
        from app.db.database import ChatRecord
        import datetime

        # Create
        record = ChatRecord(
            session_id="test_sess",
            user_id=1,
            scenic_spot="灵山胜境",
            user_input="你好",
            ai_reply="你好，欢迎来到灵山胜境",
        )
        db_session.add(record)
        db_session.commit()
        assert record.id is not None

        # Read
        fetched = db_session.query(ChatRecord).filter(ChatRecord.id == record.id).first()
        assert fetched is not None
        assert fetched.user_input == "你好"
        assert fetched.ai_reply == "你好，欢迎来到灵山胜境"
        assert fetched.scenic_spot == "灵山胜境"
        assert fetched.created_at is not None

    def test_user_model(self, db_session):
        """用户模型"""
        from app.db.database import User
        import uuid

        user = User(
            phone="13800138000",
            nickname="测试用户",
            token=str(uuid.uuid4()),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assert user.id is not None
        assert user.phone == "13800138000"
        assert user.nickname == "测试用户"
        assert len(user.token) > 10

    def test_user_phone_unique(self, db_session):
        """手机号唯一约束"""
        from app.db.database import User
        import uuid

        User.__table__.columns  # 确保表可用

        user1 = User(phone="13800138000", token=str(uuid.uuid4()))
        db_session.add(user1)
        db_session.commit()

        user2 = User(phone="13800138000", token=str(uuid.uuid4()))
        db_session.add(user2)
        with pytest.raises(Exception):
            db_session.commit()
        db_session.rollback()

    def test_knowledge_doc_model(self, db_session):
        """知识文档模型"""
        from app.db.database import KnowledgeDoc
        import datetime

        doc = KnowledgeDoc(
            title="灵山大佛介绍",
            content="灵山大佛高88米，是中国最高的青铜佛像之一。",
            category="景点讲解",
            scenic_spot="灵山胜境",
        )
        db_session.add(doc)
        db_session.commit()
        db_session.refresh(doc)

        assert doc.id is not None
        assert doc.title == "灵山大佛介绍"
        assert doc.created_at is not None
        assert doc.updated_at is not None

    def test_user_preference_model(self, db_session):
        """用户偏好模型"""
        from app.db.database import UserPreference

        pref = UserPreference(
            user_id=1,
            interests='["佛教文化"]',
            travel_style="深度游",
            group_type="独自",
        )
        db_session.add(pref)
        db_session.commit()
        db_session.refresh(pref)

        assert pref.id is not None
        import json
        assert json.loads(pref.interests) == ["佛教文化"]
        assert pref.travel_style == "深度游"

    def test_feedback_model(self, db_session):
        """反馈模型"""
        from app.db.database import Feedback

        fb = Feedback(rating=1, question="大佛高度回答准确")
        db_session.add(fb)
        db_session.commit()
        db_session.refresh(fb)

        assert fb.id is not None
        assert fb.rating == 1
        assert fb.created_at is not None

    def test_digital_human_config_model(self, db_session):
        """数字人配置模型"""
        from app.db.database import DigitalHumanConfig

        config = DigitalHumanConfig(
            name="小灵",
            scenic_spot="灵山胜境",
            avatar="/avatars/xiaoling.glb",
            voice="zh-CN-XiaoxiaoNeural",
            model_config='{"model":"deepseek","temperature":0.7}',
        )
        db_session.add(config)
        db_session.commit()
        db_session.refresh(config)

        assert config.id is not None
        assert config.name == "小灵"

    def test_default_timestamps(self, db_session):
        """默认时间戳自动填充"""
        from app.db.database import ChatRecord

        record = ChatRecord(
            session_id="ts_test",
            scenic_spot="灵山胜境",
            user_input="test",
            ai_reply="test",
        )
        db_session.add(record)
        db_session.commit()
        db_session.refresh(record)
        assert record.created_at is not None

    def test_chat_record_nullable_user_id(self, db_session):
        """user_id可为NULL"""
        from app.db.database import ChatRecord

        record = ChatRecord(
            session_id="null_user",
            scenic_spot="灵山胜境",
            user_input="test",
            ai_reply="test",
        )
        db_session.add(record)
        db_session.commit()
        db_session.refresh(record)
        assert record.user_id is None
