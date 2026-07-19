"""
用户系统 测试用例
覆盖: 发送验证码、登录、获取/更新用户信息、偏好管理
"""
import pytest

# 获取验证码的辅助函数（直接访问 conftest 中验证码存储）
from app.api.user import _codes


def get_verification_code(phone: str) -> str:
    return _codes.get(phone, "")


class TestSendCode:
    """发送验证码测试"""

    def test_send_code_success(self, client):
        """TC-USR-001: 发送验证码 — 正常流程"""
        resp = client.post("/api/user/send-code", json={"phone": "13800138000"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        # 验证验证码已存储
        code = get_verification_code("13800138000")
        assert len(code) == 4
        assert code.isdigit()

    def test_send_code_invalid_phone_short(self, client):
        """TC-USR-002: 无效手机号（不足11位）"""
        resp = client.post("/api/user/send-code", json={"phone": "123"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert "有效" in data.get("error", "")

    def test_send_code_invalid_phone_not_start_with_1(self, client):
        """无效手机号（不以1开头）"""
        resp = client.post("/api/user/send-code", json={"phone": "23456789012"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False

    def test_send_code_empty_phone(self, client):
        """TC-USR-003: 空手机号"""
        resp = client.post("/api/user/send-code", json={"phone": ""})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False

    def test_send_code_phone_with_spaces(self, client):
        """手机号带空格（strip处理）"""
        resp = client.post("/api/user/send-code", json={"phone": " 13800138000 "})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


class TestLogin:
    """登录测试"""

    def _send_code_and_get(self, client, phone="13800138000"):
        """辅助：发送验证码并获取"""
        client.post("/api/user/send-code", json={"phone": phone})
        return get_verification_code(phone)

    def test_login_success(self, client):
        """TC-USR-004: 登录成功"""
        code = self._send_code_and_get(client)
        resp = client.post("/api/user/login", json={"phone": "13800138000", "code": code})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "token" in data
        assert len(data["token"]) > 10
        assert data["nickname"] == "游客8000"
        assert data["phone"] == "13800138000"

    def test_login_wrong_code(self, client):
        """TC-USR-005: 验证码错误"""
        self._send_code_and_get(client)
        resp = client.post("/api/user/login", json={"phone": "13800138000", "code": "0000"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert "错误" in data.get("error", "")

    def test_login_no_code_sent(self, client):
        """TC-USR-006: 未发送验证码"""
        resp = client.post("/api/user/login", json={"phone": "13900139000", "code": "1234"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False

    def test_login_code_one_time(self, client):
        """TC-USR-007: 验证码一次性"""
        code = self._send_code_and_get(client)
        # 第一次登录成功
        resp1 = client.post("/api/user/login", json={"phone": "13800138000", "code": code})
        assert resp1.json()["success"] is True
        # 第二次使用同一验证码
        resp2 = client.post("/api/user/login", json={"phone": "13800138000", "code": code})
        assert resp2.json()["success"] is False

    def test_login_renew_token(self, client):
        """TC-USR-008: 重复登录刷新token"""
        code1 = self._send_code_and_get(client)
        resp1 = client.post("/api/user/login", json={"phone": "13800138000", "code": code1})
        token1 = resp1.json()["token"]

        code2 = self._send_code_and_get(client, "13800138000")
        resp2 = client.post("/api/user/login", json={"phone": "13800138000", "code": code2})
        token2 = resp2.json()["token"]

        assert token1 != token2

    def test_login_auto_creates_preference(self, client, db_session):
        """登录后自动创建默认偏好"""
        code = self._send_code_and_get(client)
        client.post("/api/user/login", json={"phone": "13800138000", "code": code})

        from app.db.database import UserPreference
        pref = db_session.query(UserPreference).first()
        assert pref is not None
        assert pref.interests == "[]"

    def test_login_existing_user(self, client, db_session):
        """已存在的用户登录"""
        # 先创建用户
        from app.db.database import User
        import uuid
        user = User(phone="13700137000", nickname="老用户", token=str(uuid.uuid4()))
        db_session.add(user)
        db_session.commit()

        # 登录
        code = self._send_code_and_get(client, "13700137000")
        resp = client.post("/api/user/login", json={"phone": "13700137000", "code": code})
        assert resp.json()["success"] is True
        assert resp.json()["nickname"] == "老用户"


class TestProfile:
    """个人资料测试"""

    def _login(self, client, phone="13800138000"):
        code = client.post("/api/user/send-code", json={"phone": phone}).json()
        code_val = get_verification_code(phone)
        resp = client.post("/api/user/login", json={"phone": phone, "code": code_val})
        return resp.json()["token"]

    def test_get_profile_authenticated(self, client):
        """TC-USR-009: 已登录获取信息"""
        token = self._login(client)
        resp = client.get("/api/user/profile", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["nickname"] == "游客8000"
        assert data["phone"] == "13800138000"
        assert isinstance(data["interests"], list)

    def test_get_profile_no_auth(self, client):
        """TC-USR-010: 未登录"""
        resp = client.get("/api/user/profile")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False

    def test_get_profile_invalid_token(self, client):
        """TC-USR-011: 无效token"""
        resp = client.get("/api/user/profile", headers={"Authorization": "Bearer invalid_token"})
        assert resp.status_code == 200
        assert resp.json()["success"] is False

    def test_update_profile_all_fields(self, client):
        """TC-USR-012: 更新全部字段"""
        token = self._login(client)
        resp = client.put(
            "/api/user/profile",
            json={
                "nickname": "旅行者小王",
                "interests": ["佛教文化", "建筑艺术"],
                "travel_style": "深度游",
                "group_type": "独自",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # 验证更新结果
        get_resp = client.get("/api/user/profile", headers={"Authorization": f"Bearer {token}"})
        data = get_resp.json()
        assert data["nickname"] == "旅行者小王"
        assert set(data["interests"]) == {"佛教文化", "建筑艺术"}
        assert data["travel_style"] == "深度游"
        assert data["group_type"] == "独自"

    def test_update_profile_partial(self, client):
        """TC-USR-013: 部分更新"""
        token = self._login(client)
        # 先设置完整数据
        client.put(
            "/api/user/profile",
            json={"interests": ["佛教文化"], "travel_style": "深度游"},
            headers={"Authorization": f"Bearer {token}"},
        )
        # 只更新昵称
        resp = client.put(
            "/api/user/profile",
            json={"nickname": "新昵称"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.json()["success"] is True

        data = client.get("/api/user/profile", headers={"Authorization": f"Bearer {token}"}).json()
        assert data["nickname"] == "新昵称"
        assert data["travel_style"] == "深度游"  # 其他字段不变
        assert "佛教文化" in data["interests"]

    def test_update_profile_no_auth(self, client):
        """TC-USR-014: 未登录更新"""
        resp = client.put("/api/user/profile", json={"nickname": "test"})
        assert resp.json()["success"] is False

    def test_update_profile_empty_interests(self, client):
        """清空兴趣字段"""
        token = self._login(client)
        resp = client.put(
            "/api/user/profile",
            json={"interests": []},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.json()["success"] is True
        data = client.get("/api/user/profile", headers={"Authorization": f"Bearer {token}"}).json()
        assert data["interests"] == []

    def test_update_profile_nickname_empty(self, client):
        """昵称设为空字符串"""
        token = self._login(client)
        resp = client.put(
            "/api/user/profile",
            json={"nickname": ""},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = client.get("/api/user/profile", headers={"Authorization": f"Bearer {token}"}).json()
        assert data["nickname"] == ""
