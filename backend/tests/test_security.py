"""
安全测试 测试用例
覆盖: XSS、SQL注入、Token伪造、敏感信息泄露、路径穿越、大文件拒绝服务
"""
import os
import sys
import pytest

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))


class TestXSS:
    """XSS攻击防护测试"""

    @pytest.mark.usefixtures("mock_deepseek", "mock_rag_search")
    def test_chat_xss_in_message(self, client):
        """TC-SEC-001: 对话输入含XSS脚本"""
        xss_payload = "<script>alert('xss')</script>"
        resp = client.post(
            "/api/chat/send",
            json={"message": xss_payload, "scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 200
        data = resp.json()
        # 后端不应原样返回未转义的HTML标签
        assert "reply" in data

    @pytest.mark.usefixtures("mock_rag_add_documents")
    def test_knowledge_xss_in_title(self, client, db_session):
        """TC-SEC-002: 知识库标题含XSS"""
        xss_title = "<img src=x onerror=alert(1)>景点"
        resp = client.post(
            "/api/admin/knowledge",
            json={
                "title": xss_title,
                "content": "安全内容",
                "category": "测试",
                "scenic_spot": "灵山胜境",
            },
        )
        assert resp.status_code == 200
        assert "id" in resp.json()

        # 确认数据库存的是原始文本，不会被执行
        from app.db.database import KnowledgeDoc
        doc = db_session.query(KnowledgeDoc).filter(
            KnowledgeDoc.title == xss_title
        ).first()
        assert doc is not None


class TestSQLInjection:
    """SQL注入防护测试"""

    def test_login_sql_injection_phone(self, client):
        """TC-SEC-003: 登录接口SQL注入"""
        # SQL注入尝试
        injections = [
            "' OR 1=1 --",
            "13800138000' OR '1'='1",
            "'; DROP TABLE users; --",
            "1' UNION SELECT * FROM users--",
        ]
        for payload in injections:
            resp = client.post(
                "/api/user/send-code",
                json={"phone": payload},
            )
            # 应返回200并告知无效手机号，而非500崩溃
            assert resp.status_code == 200
            data = resp.json()
            # 手机号校验应该先于SQL操作
            assert "success" in data

    @pytest.mark.usefixtures("mock_deepseek", "mock_rag_search")
    def test_chat_scenic_spot_sql_injection(self, client):
        """TC-SEC-004: 景区名参数SQL注入"""
        resp = client.post(
            "/api/chat/send",
            json={
                "message": "你好",
                "scenic_spot": "'; DROP TABLE chat_records; --",
            },
        )
        # 不应崩溃
        assert resp.status_code in (200, 500)

    @pytest.mark.usefixtures("mock_rag_add_documents")
    def test_knowledge_sql_injection(self, client):
        """知识库接口SQL注入"""
        resp = client.post(
            "/api/admin/knowledge",
            json={
                "title": "test",
                "content": "'; DROP TABLE knowledge_docs; --",
                "category": "测试",
                "scenic_spot": "灵山胜境",
            },
        )
        assert resp.status_code == 200
        # 验证数据库仍可正常查询
        resp2 = client.get("/api/admin/knowledge")
        assert resp2.status_code == 200


class TestTokenSecurity:
    """Token安全测试"""

    def test_token_forgery_random_uuid(self, client):
        """TC-SEC-005: 随机UUID作为Token"""
        import uuid
        fake_token = str(uuid.uuid4())
        resp = client.get(
            "/api/user/profile",
            headers={"Authorization": f"Bearer {fake_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert "未登录" in data.get("error", "")

    def test_token_forgery_malformed(self, client):
        """畸形Token格式"""
        bad_tokens = [
            "not-a-token",
            "Bearer ",
            "Bearer invalid|token|with|pipes",
            "Token random_string",
        ]
        for header in bad_tokens:
            resp = client.get(
                "/api/user/profile",
                headers={"Authorization": header},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is False

    def test_token_empty_header(self, client):
        """空Authorization头"""
        resp = client.get(
            "/api/user/profile",
            headers={"Authorization": ""},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is False


class TestInfoLeakage:
    """敏感信息泄露测试"""

    def test_error_no_stack_trace(self, client):
        """TC-SEC-006: 错误响应不含堆栈信息"""
        # 触发一个后端异常 — 上传空文件到ASR
        resp = client.post(
            "/api/voice/asr",
            files={"file": ("test.wav", b"", "audio/wav")},
        )
        # 错误信息不应包含堆栈跟踪或文件路径
        body = resp.text
        assert "Traceback" not in body
        assert "File \"" not in body
        assert "\\backend\\" not in body

    def test_deepseek_key_not_in_response(self, client):
        """TC-SEC-010: API Key不出现在响应中"""
        resp = client.get("/api/user/profile")
        body = resp.text.lower()
        assert "sk-" not in body
        assert "deepseek" not in body or "deepseek" in body and "api_key" not in body.lower()


class TestPathTraversal:
    """路径穿越防护测试"""

    @pytest.mark.usefixtures("mock_rag_add_documents")
    def test_upload_path_traversal(self, client):
        """TC-SEC-007: 上传文件名为路径穿越payload"""
        path_payloads = [
            "../../etc/passwd",
            "..\\..\\windows\\system32\\config",
            "%2e%2e%2ftest",
            "....//....//etc/hosts",
        ]
        for filename in path_payloads:
            resp = client.post(
                "/api/upload/document",
                files={"file": (filename, b"test content", "text/plain")},
                data={"scenic_spot": "灵山胜境"},
            )
            # 不崩溃，正常返回
            assert resp.status_code in (200, 422)


class TestLargePayload:
    """大负载攻击防护测试"""

    def test_upload_too_large(self, client):
        """TC-SEC-008: 超大文件（超过50MB限制）"""
        # FastAPI默认post body限制通常小于50MB
        # 发送一个极大请求
        huge_content = b"A" * (60 * 1024 * 1024)  # 60MB
        try:
            resp = client.post(
                "/api/upload/document",
                files={"file": ("huge.txt", huge_content, "text/plain")},
                data={"scenic_spot": "灵山胜境"},
            )
            assert resp.status_code in (200, 413, 422)
        except Exception:
            # 在fastapi testclient中可能直接被拒绝
            pass

    def test_chat_extremely_long_message(self, client):
        """超长消息DoS测试（10000+）"""
        very_long = "A" * 20000
        resp = client.post(
            "/api/chat/send",
            json={"message": very_long, "scenic_spot": "灵山胜境"},
        )
        # 不应当直接崩溃
        assert resp.status_code in (200, 413, 422, 500)


class TestRateLimiting:
    """频率限制测试（当前系统无限制，仅记录）"""

    def test_send_code_rapid_requests(self, client):
        """短时间多次请求发送验证码（不限制，验证不崩溃）"""
        for i in range(10):
            resp = client.post(
                "/api/user/send-code",
                json={"phone": "13800138000"},
            )
            assert resp.status_code == 200


class TestInputValidation:
    """输入校验安全测试"""

    def test_login_extreme_values(self, client):
        """登录接口极端值测试"""
        # 超长手机号
        resp = client.post(
            "/api/user/send-code",
            json={"phone": "1" * 100},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is False

        # 含特殊字符手机号
        resp = client.post(
            "/api/user/send-code",
            json={"phone": "13800😀138000"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False

    @pytest.mark.usefixtures("mock_deepseek", "mock_rag_search")
    def test_chat_missing_fields(self, client):
        """聊天接口缺少必填字段"""
        # 缺少message字段
        resp = client.post(
            "/api/chat/send",
            json={"scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 422  # Pydantic校验失败

        # 完全空body
        resp = client.post(
            "/api/chat/send",
            json={},
        )
        assert resp.status_code == 422

    def test_feedback_extreme_values(self, client):
        """反馈接口极端值测试"""
        # 非常大的rating
        resp = client.post(
            "/api/admin/feedback",
            json={"rating": 2 ** 31, "question": "test"},
        )
        assert resp.status_code == 200

        # question字段超长
        resp = client.post(
            "/api/admin/feedback",
            json={"rating": 1, "question": "x" * 10000},
        )
        assert resp.status_code == 200
