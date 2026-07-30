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


class VisitorReview(Base):
    """游客评价 — 按景点存储、管理后台可管理"""
    __tablename__ = "visitor_reviews"
    id = Column(Integer, primary_key=True, autoincrement=True)
    spot_id = Column(String(64), nullable=False, index=True)  # 对应前端 ScenicSpot.id (如 'lingshandafo')
    author = Column(String(64), default="灵山游客")
    avatar = Column(String(256), default="")  # emoji 或头像 URL
    rating = Column(Integer, default=5)  # 1-5
    text = Column(Text, default="")
    deleted = Column(Integer, default=0)  # 0=正常, 1=已删除（软删除）
    created_at = Column(DateTime, default=datetime.datetime.now)


class VisitorCheckin(Base):
    """游客打卡 — 按景点存储、管理后台可管理"""
    __tablename__ = "visitor_checkins"
    id = Column(Integer, primary_key=True, autoincrement=True)
    spot_id = Column(String(64), nullable=False, index=True)
    author = Column(String(64), default="灵山游客")
    image = Column(String(512), default="")  # 图片 URL
    caption = Column(String(256), default="")
    deleted = Column(Integer, default=0)  # 0=正常, 1=已删除（软删除）
    created_at = Column(DateTime, default=datetime.datetime.now)


def get_collection_name(scenic_spot: str, db) -> str:
    """根据景区名/slug 获取 ChromaDB 集合名"""
    spot = db.query(ScenicSpot).filter(
        (ScenicSpot.name == scenic_spot) | (ScenicSpot.slug == scenic_spot)
    ).first()
    return spot.slug if (spot and spot.enabled) else scenic_spot


def seed_default_scenic_spot():
    """首次启动时自动创建灵山胜境 + 示例评价/打卡"""
    db = SessionLocal()
    try:
        if not db.query(ScenicSpot).filter(ScenicSpot.slug == "lingshan").first():
            db.add(ScenicSpot(name="灵山胜境", slug="lingshan",
                description="无锡灵山胜境，国家5A级旅游景区", enabled=1))
            db.commit()

        # 种子评价数据（仅当表中无数据时插入）
        if db.query(VisitorReview).count() == 0:
            seed_reviews = [
                VisitorReview(spot_id='lingshandafo', author='旅行者小陈', avatar='🧑‍🦰', rating=5,
                    text='太震撼了！站在大佛脚下才真正感受到什么叫庄严。爬上216级台阶后俯瞰太湖，整个灵山尽收眼底。'),
                VisitorReview(spot_id='lingshandafo', author='佛系青年', avatar='🧘', rating=5,
                    text='抱佛脚真的很有仪式感，工作人员说顺时针绕佛三圈祈福最灵验。建议大家早上去，人少光线好。'),
                VisitorReview(spot_id='lingshandafo', author='太湖边的鱼', avatar='🐟', rating=4,
                    text='博物馆里展示了建造历程，才知道用了725吨铜。电梯对老人很友好，不用爬台阶也能近距离瞻仰。'),
                VisitorReview(spot_id='jiulongguanyu', author='江南旅人', avatar='🌸', rating=5,
                    text='九龙喷水30米高太壮观了！莲花绽放的那一刻所有人都拿出手机拍照。建议提前10分钟占好位置。'),
                VisitorReview(spot_id='jiulongguanyu', author='带着爸妈看世界', avatar='👨‍👩‍👧', rating=5,
                    text='爸妈看得特别开心，说这是他们见过最震撼的音乐喷泉。八功德水一定要接，寓意很好。'),
                VisitorReview(spot_id='fansong', author='建筑迷小周', avatar='🏗️', rating=5,
                    text='东阳木雕和琉璃壁画精美绝伦，星空穹顶太梦幻了。建议留足1小时慢慢看，每一处都是艺术品。'),
                VisitorReview(spot_id='fansong', author='文艺青年阿琳', avatar='🎨', rating=4,
                    text='吉祥颂演出非常值得看，270度环幕沉浸感很强。非遗工艺的集中展示，让人感受到中国传统之美。'),
                VisitorReview(spot_id='fanshouguangchang', author='祈福小达人', avatar='🙏', rating=5,
                    text='和天下第一掌击掌的感觉太奇妙了！据说摸摸佛手能保佑平安，我摸了三遍哈哈。'),
                VisitorReview(spot_id='xiangfuchansi', author='历史文化控', avatar='📚', rating=5,
                    text='千年古刹的底蕴是其他景点无法比拟的。站在唐玄奘曾经驻锡的地方，仿佛穿越了时空。'),
                VisitorReview(spot_id='wuyintancheng', author='西藏归来', avatar='🏔️', rating=4,
                    text='不用去西藏就能感受到藏传佛教的氛围，转经筒体验很特别。金顶红墙在阳光下格外壮丽。'),
            ]
            db.add_all(seed_reviews)
            db.commit()

        if db.query(VisitorCheckin).count() == 0:
            seed_checkins = [
                VisitorCheckin(spot_id='lingshandafo', author='摄影老张',
                    image='https://picsum.photos/seed/checkin-buddha1/400/300', caption='清晨的大佛，金光洒在佛像上'),
                VisitorCheckin(spot_id='lingshandafo', author='小鹿旅行记',
                    image='https://picsum.photos/seed/checkin-buddha2/400/300', caption='抱佛脚祈福，愿家人平安'),
                VisitorCheckin(spot_id='lingshandafo', author='山水之间',
                    image='https://picsum.photos/seed/checkin-buddha3/400/300', caption='216级台阶，每一步都是虔诚'),
                VisitorCheckin(spot_id='jiulongguanyu', author='摄影老张',
                    image='https://picsum.photos/seed/checkin-dragon1/400/300', caption='九龙喷水瞬间，水雾中现彩虹'),
                VisitorCheckin(spot_id='fansong', author='旅行达人小王',
                    image='https://picsum.photos/seed/checkin-palace1/400/300', caption='梵宫星空穹顶，太梦幻了'),
                VisitorCheckin(spot_id='fanshouguangchang', author='幸福一家人',
                    image='https://picsum.photos/seed/checkin-hand1/400/300', caption='与天下第一掌合影，祈福平安'),
            ]
            db.add_all(seed_checkins)
            db.commit()
    finally:
        db.close()


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    Base.metadata.create_all(engine)

    # 兼容旧表：先补列，再种子数据（种子数据依赖这些列）
    def _add_column(table: str, col_def: str):
        try:
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_def}"))
                conn.commit()
        except Exception:
            pass  # 列已存在则忽略

    _add_column("chat_records", "user_id INTEGER")
    _add_column("knowledge_docs", "chroma_ids TEXT DEFAULT '[]'")
    _add_column("visitor_reviews", "deleted INTEGER DEFAULT 0")
    _add_column("visitor_checkins", "deleted INTEGER DEFAULT 0")

    seed_default_scenic_spot()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 启动时自动建表（仅创建不存在的表，不影响已有数据）
init_db()
