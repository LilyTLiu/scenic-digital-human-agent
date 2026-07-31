import random
import uuid
import json
from pathlib import Path
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db, User, UserPreference

router = APIRouter()


class SendCodeRequest(BaseModel):
    phone: str


class LoginRequest(BaseModel):
    phone: str
    code: str


class ProfileUpdate(BaseModel):
    nickname: str | None = None
    interests: list[str] | None = None
    travel_style: str | None = None
    group_type: str | None = None


# In-memory verification codes (demo mode)
_codes: dict[str, str] = {}

CODE_LOG_PATH = Path(__file__).resolve().parents[3] / "logs" / "verification_codes.log"


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    user = db.query(User).filter(User.token == token).first()
    return user


def require_user(user: User | None = Depends(get_current_user)) -> User:
    return user


@router.post("/send-code")
async def send_code(req: SendCodeRequest):
    """发送验证码（演示模式：生成4位验证码打印到控制台）"""
    phone = req.phone.strip()
    if not phone or len(phone) != 11 or not phone.startswith("1"):
        return {"success": False, "error": "请输入有效的11位手机号"}

    code = str(random.randint(1000, 9999))
    _codes[phone] = code
    CODE_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CODE_LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(f"手机号: {phone}  验证码: {code}\n")
    print(f"\n{'='*50}")
    print(f"[验证码] 手机号: {phone}  验证码: {code}")
    print(f"{'='*50}\n")
    return {"success": True}


@router.get("/codes")
async def get_codes():
    """验证码仅在后端控制台输出，不通过接口暴露。"""
    return {"success": False, "error": "验证码请查看后端控制台输出"}


@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """验证码登录"""
    phone = req.phone.strip()
    code = req.code.strip()
    expected = _codes.get(phone)
    if expected and code == expected:
        del _codes[phone]
        user = db.query(User).filter(User.phone == phone).first()
        if not user:
            user = User(phone=phone, nickname=f"游客{phone[-4:]}", token=str(uuid.uuid4()))
            db.add(user)
            db.flush()
            # 创建默认偏好
            pref = UserPreference(user_id=user.id, interests="[]", travel_style="", group_type="")
            db.add(pref)
        else:
            user.token = str(uuid.uuid4())
        db.commit()
        db.refresh(user)
        return {"success": True, "token": user.token, "nickname": user.nickname, "phone": user.phone}
    return {"success": False, "error": "验证码错误"}


@router.get("/profile")
async def get_profile(user: User | None = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取个人信息和偏好"""
    if not user:
        return {"success": False, "error": "未登录"}
    pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    return {
        "success": True,
        "nickname": user.nickname,
        "phone": user.phone,
        "avatar": user.avatar or "",
        "interests": json.loads(pref.interests) if pref and pref.interests else [],
        "travel_style": pref.travel_style if pref else "",
        "group_type": pref.group_type if pref else "",
    }


@router.put("/profile")
async def update_profile(
    req: ProfileUpdate,
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新个人信息和偏好"""
    if not user:
        return {"success": False, "error": "未登录"}

    if req.nickname is not None:
        user.nickname = req.nickname

    pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    if not pref:
        pref = UserPreference(user_id=user.id, interests="[]", travel_style="", group_type="")
        db.add(pref)
    if req.interests is not None:
        pref.interests = json.dumps(req.interests, ensure_ascii=False)
    if req.travel_style is not None:
        pref.travel_style = req.travel_style
    if req.group_type is not None:
        pref.group_type = req.group_type

    db.commit()
    return {"success": True}
