"""
pytest 共享 fixtures
提供测试数据库、测试客户端、mock外部服务等公共设施
"""
import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 确保 backend 目录在 Python 路径中
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))

# ---------- 全局配置：使用独立的测试数据库 ----------
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_data.db")
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"
os.environ["TESTING"] = "1"
os.environ["HF_HUB_OFFLINE"] = "1"

# 必须先替换 embedding 函数再导入业务模块（chromadb 在模块级别加载模型）
import chromadb.utils.embedding_functions as ef

class MockEmbeddingFunction:
    """符合 ChromaDB EmbeddingFunction 接口的 mock"""
    def __init__(self, *args, **kwargs):
        pass
    def __call__(self, input):
        if isinstance(input, str):
            return [0.0] * 768
        return [[0.0] * 768 for _ in input]

ef.SentenceTransformerEmbeddingFunction = MockEmbeddingFunction

# 创建测试引擎（在导入业务模块前，不依赖任何 app 模块）
test_engine = create_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(bind=test_engine)

# 现在导入业务模块
from app.db.database import Base, get_db
from app.app import app
from app.api.user import _codes  # 验证码存储

# 覆盖 rag 模块中已创建的 default_ef 实例
import app.core.rag as rag_module
rag_module.default_ef = MockEmbeddingFunction()

class MockChromaCollection:
    """Mock ChromaDB 集合"""
    def __init__(self, *args, **kwargs):
        pass
    def query(self, query_texts, n_results):
        return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
    def add(self, *args, **kwargs):
        pass

rag_module.get_chroma_client = lambda: MockChromaCollection()
rag_module.create_knowledge_base = lambda name: MockChromaCollection()

# 覆盖 SessionLocal — 让 chat.py 等直接使用 SessionLocal() 的路由也使用测试库
import app.db.database as db_module
db_module.SessionLocal = TestingSessionLocal
db_module.DB_PATH = TEST_DB_PATH


def override_get_db():
    """覆盖 app 中的 get_db 依赖"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """全局只执行一次：创建测试数据库表"""
    with test_engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.commit()
    Base.metadata.create_all(bind=test_engine)
    yield
    test_engine.dispose()
    import time
    time.sleep(0.3)
    for _ in range(3):
        try:
            os.remove(TEST_DB_PATH)
            break
        except (FileNotFoundError, PermissionError):
            time.sleep(0.2)


@pytest.fixture(autouse=True)
def clean_db(request):
    """每个测试用例前清空所有表数据"""
    if "setup_test_db" in request.keywords:
        yield
        return
    with test_engine.connect() as conn:
        conn.execute(text("PRAGMA foreign_keys = OFF"))
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.execute(text("PRAGMA foreign_keys = ON"))
        conn.commit()
    _codes.clear()
    yield


@pytest.fixture(scope="function")
def client():
    """提供 FastAPI 测试客户端"""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def db_session():
    """提供一个独立的数据库会话"""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------
# 测试数据 fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_knowledge(db_session):
    from app.db.database import KnowledgeDoc
    import datetime
    items = [
        KnowledgeDoc(title="灵山大佛", content="灵山大佛高88米，建于1997年，位于无锡灵山胜境",
                     category="景点讲解", scenic_spot="灵山胜境", updated_at=datetime.datetime.now()),
        KnowledgeDoc(title="九龙灌浴", content="九龙灌浴表演时间：每天10:00和14:00",
                     category="景点讲解", scenic_spot="灵山胜境", updated_at=datetime.datetime.now()),
        KnowledgeDoc(title="灵山历史", content="灵山胜境位于无锡马山，是中国著名的佛教文化景区",
                     category="文史资料", scenic_spot="灵山胜境", updated_at=datetime.datetime.now()),
    ]
    for item in items:
        db_session.add(item)
    db_session.commit()
    for item in items:
        db_session.refresh(item)
    return [item.id for item in items]


@pytest.fixture
def sample_user(db_session):
    from app.db.database import User, UserPreference
    import uuid
    user = User(phone="13800138000", nickname="测试游客", token=str(uuid.uuid4()))
    db_session.add(user)
    db_session.flush()
    pref = UserPreference(user_id=user.id, interests='["佛教文化", "建筑艺术"]',
                          travel_style="深度游", group_type="独自")
    db_session.add(pref)
    db_session.commit()
    db_session.refresh(user)
    return user, user.token


@pytest.fixture
def sample_chat_records(db_session):
    from app.db.database import ChatRecord
    import datetime
    records = [
        ChatRecord(session_id="test_sess_1", user_id=1, scenic_spot="灵山胜境",
                   user_input="灵山大佛有多高？",
                   ai_reply="灵山大佛高88米，是中国最高的青铜佛像之一。",
                   created_at=datetime.datetime.now()),
        ChatRecord(session_id="test_sess_1", user_id=1, scenic_spot="灵山胜境",
                   user_input="九龙灌浴几点表演？",
                   ai_reply="九龙灌浴每天10:00和14:00各表演一场。",
                   created_at=datetime.datetime.now()),
    ]
    for r in records:
        db_session.add(r)
    db_session.commit()
    return records


@pytest.fixture
def sample_feedback(db_session):
    from app.db.database import Feedback
    import datetime
    feedbacks = [
        Feedback(rating=1, question="大佛介绍", created_at=datetime.datetime.now()),
        Feedback(rating=1, question="表演时间", created_at=datetime.datetime.now()),
        Feedback(rating=-1, question="路线推荐", created_at=datetime.datetime.now()),
    ]
    for f in feedbacks:
        db_session.add(f)
    db_session.commit()
    return feedbacks


# ---------------------------------------------------------------------------
# Mock DeepSeek API
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_deepseek(mocker):
    """Mock DeepSeek API 调用"""
    content = "灵山大佛高88米，建于1997年，位于无锡灵山胜境。"

    async def mock_chat(*args, **kwargs):
        return content

    async def mock_chat_stream(*args, **kwargs):
        for token in ["灵山", "大佛", "高", "88", "米"]:
            yield token

    async def mock_chat_with_system(*args, **kwargs):
        return content

    mocker.patch("app.api.chat.chat", side_effect=mock_chat)
    mocker.patch("app.api.chat.chat_stream", side_effect=mock_chat_stream)
    mocker.patch("app.api.chat.chat_with_system", side_effect=mock_chat_with_system)


@pytest.fixture
def mock_deepseek_stream(mocker):
    """Mock 流式 DeepSeek"""
    async def mock_stream(*args, **kwargs):
        for token in ["欢迎", "来到", "灵山", "胜境"]:
            yield token
    mocker.patch("app.api.chat.chat_stream", side_effect=mock_stream)


@pytest.fixture
def mock_deepseek_failure(mocker):
    """Mock DeepSeek 调用失败"""
    async def mock_fail(*args, **kwargs):
        raise RuntimeError("DeepSeek API 服务不可用")

    async def mock_fail_stream(*args, **kwargs):
        raise RuntimeError("DeepSeek API 服务不可用")
        yield  # pragma: no cover — 使函数成为异步生成器

    mocker.patch("app.api.chat.chat", side_effect=mock_fail)
    mocker.patch("app.api.chat.chat_stream", side_effect=mock_fail_stream)
    mocker.patch("app.api.chat.chat_with_system", side_effect=mock_fail)


# ---------------------------------------------------------------------------
# Mock RAG / ChromaDB (per-test fixtures, 覆盖模块级 mock)
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_rag_search(mocker):
    mock_results = [
        {"content": "灵山大佛高88米，建于1997年，位于无锡灵山胜境。",
         "metadata": {"source": "景点数据库"}, "score": 0.92},
        {"content": "九龙灌浴表演时间：每天10:00和14:00",
         "metadata": {"source": "景点数据库"}, "score": 0.85},
    ]
    mocker.patch("app.api.chat.search", return_value=mock_results)
    return mock_results


@pytest.fixture
def mock_rag_search_empty(mocker):
    mocker.patch("app.api.chat.search", return_value=[])


@pytest.fixture
def mock_rag_add_documents(mocker):
    mocker.patch("app.api.admin.add_documents", return_value=3)
    mocker.patch("app.api.upload.add_documents", return_value=3)


# ---------------------------------------------------------------------------
# Mock TTS/ASR
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_tts(mocker):
    async def mock_synthesize(*args, **kwargs):
        return b"fake_mp3_audio_data"
    mocker.patch("app.api.voice.synthesize", side_effect=mock_synthesize)


@pytest.fixture
def mock_asr(mocker):
    async def mock_transcribe(*args, **kwargs):
        return ("灵山大佛在哪里", 0.95)
    mocker.patch("app.api.voice.transcribe", side_effect=mock_transcribe)


@pytest.fixture
def mock_tts_failure(mocker):
    async def mock_fail(*args, **kwargs):
        raise RuntimeError("Edge TTS 服务不可用")
    mocker.patch("app.api.voice.synthesize", side_effect=mock_fail)
