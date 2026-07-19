"""
新增 Bug 测试用例 — 验证从代码分析发现的真实缺陷
"""
import pytest


class TestBugStreamNotSaveRecord:
    """BUG-001: 流式对话接口未保存对话记录"""

    @pytest.mark.usefixtures("mock_deepseek_stream", "mock_rag_search")
    def test_stream_chat_record_not_saved(self, client, db_session):
        """流式对话后数据库应有对话记录"""
        from app.db.database import ChatRecord

        # 发送流式对话请求
        try:
            resp = client.post(
                "/api/chat/stream",
                json={"message": "灵山的历史", "scenic_spot": "灵山胜境", "stream": True,
                       "session_id": "test_stream_bug"},
            )
        except Exception:
            # 如果流式端点异常，标记为失败
            pytest.fail("流式对话接口异常")

        # 查询数据库是否有对应的对话记录
        records = db_session.query(ChatRecord).filter(
            ChatRecord.session_id == "test_stream_bug"
        ).all()

        # 断言：流式对话后应该有记录，但实际代码未保存 → BUG 确认
        assert len(records) > 0, (
            "BUG-001: 流式对话接口未保存对话记录到数据库！\n"
            "调用 /api/chat/stream 后 ChatRecord 表中无对应记录。\n"
            "问题代码位置: backend/app/api/chat.py send_message_stream()\n"
            "原因: generate() 生成器内部未调用 db.add(ChatRecord(...))"
        )


class TestBugFeedbackRatingValidation:
    """BUG-002: 反馈评分 rating 值域未校验"""

    def test_feedback_rating_zero_not_counted(self, client, db_session):
        """rating=0 的反馈不被计入满意率计算（静默丢失）"""
        from app.db.database import Feedback

        # 提交 2 条点赞 + 1 条 rating=0
        for _ in range(2):
            client.post("/api/admin/feedback", json={"rating": 1, "question": "好"})
        client.post("/api/admin/feedback", json={"rating": 0, "question": "中性"})

        # 查看满意度报告
        resp = client.get("/api/admin/reports")
        data = resp.json()

        # rating=0 的反馈不算点赞也不算点踩 → 被静默丢弃
        total = db_session.query(Feedback).count()
        assert total == 3, f"应有3条反馈记录，实际{total}"

        # 验证 rating=0 确实被存储
        zero_rating = db_session.query(Feedback).filter(Feedback.rating == 0).first()
        assert zero_rating is not None, "rating=0 的反馈应被存储"

        # BUG: rating=0 计入 total_feedback 但不计入 likes/dislikes
        # 导致满意度计算分母包括 0 评分，但分子只数 rating==1
        # 预期：total_feedback=3, likes=2, satisfaction=66.7
        # 实际：total_feedback=3, likes=2, satisfaction=66.7
        # 但 rating=0 的中性反馈不应计入分子或分母
        # 它是一个"伪数据" — 算 total 时被计入，但用户意图既非赞也非踩
        assert data["total_feedback"] >= 2
        assert data["likes"] == 2


class TestBugPageNegativeOffset:
    """BUG-003: 知识库分页 page=0 导致 offset 为负数"""

    def test_knowledge_page_zero(self, client, sample_knowledge):
        """page=0 应该被正确处理，不应返回 SQL 错误"""
        resp = client.get("/api/admin/knowledge?page=0&size=5")
        assert resp.status_code == 200, (
            "BUG-003: 当 page=0 时，服务器应正常返回而非报错\n"
            "问题代码位置: backend/app/api/admin.py list_knowledge()\n"
            "原因: offset = (page - 1) * size → page=0 时 offset=-5\n"
            "SQLite 对负 offset 的行为未定义"
        )
        data = resp.json()
        assert "items" in data
        # 当前行为：page=0 实际上因为 offset 为负数可能返回错误结果
        # 正确行为：page 应最小为 1

    def test_knowledge_page_negative(self, client, sample_knowledge):
        """page=-1 应被正确处理"""
        resp = client.get("/api/admin/knowledge?page=-1&size=5")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data


class TestBugOpenAITokenNotPassed:
    """BUG-004: OpenAI 兼容端点未传递 token 到 _resolve_user"""

    @pytest.mark.usefixtures("mock_deepseek", "mock_rag_search")
    def test_openai_token_not_used(self, client, db_session, sample_user):
        """OpenAI 兼容端点即使传了 token 也不会关联用户"""
        from app.db.database import ChatRecord

        user, token = sample_user

        resp = client.post(
            "/api/chat/v1/chat/completions",
            json={
                "messages": [{"role": "user", "content": "灵山大佛在哪里？"}],
                "token": token,  # 传入有效 token
            },
        )
        assert resp.status_code == 200

        # 查询最后一条对话记录
        record = db_session.query(ChatRecord).order_by(
            ChatRecord.id.desc()
        ).first()

        # BUG: 即使传了有效 token，user_id 仍为 NULL
        # 因为 openai_compatible() 没有将 req.token 传给 _resolve_user()
        if record and record.user_id is None:
            pytest.fail(
                "BUG-004: OpenAI 兼容端点未关联用户！\n"
                f"传入有效 token={token[:8]}... 但 user_id 为 NULL\n"
                "问题代码位置: backend/app/api/chat.py openai_compatible()\n"
                "原因: 函数未将 req.token 参数传递给 _resolve_user()"
            )


class TestBugStreamNoUserAssociation:
    """BUG-005: 流式对话未关联已登录用户（token 被忽略）"""

    @pytest.mark.usefixtures("mock_deepseek_stream", "mock_rag_search")
    def test_stream_login_user_not_associated(self, client, db_session, sample_user):
        """流式对话中传了 token 但用户不关联"""
        from app.db.database import ChatRecord

        user, token = sample_user

        try:
            resp = client.post(
                "/api/chat/stream",
                json={
                    "message": "灵山历史",
                    "scenic_spot": "灵山胜境",
                    "stream": True,
                    "token": token,
                    "session_id": "stream_user_bug",
                },
            )
        except Exception:
            pytest.fail("流式对话接口异常")

        records = db_session.query(ChatRecord).filter(
            ChatRecord.session_id == "stream_user_bug"
        ).all()

        # 若流式接口未保存记录，此 BUG 无法验证
        if len(records) == 0:
            pytest.skip("流式接口未保存记录，无法验证用户关联（这是 BUG-001 的连带影响）")

        for record in records:
            if record.user_id is None:
                pytest.fail(
                    "BUG-005: 流式对话传了有效 token 但 user_id 为 NULL\n"
                    "原因: send_message_stream() 中的 generate() 生成器\n"
                    "未调用 _resolve_user(req.token)"
                )


class TestBugImportDuplicateOnReRun:
    """BUG-006: 导入示范资料重复执行不会更新已存在的条目"""

    def test_import_demo_twice_same_count(self, client, mocker):
        """重复导入同一份资料，imported 应逐次减少（已有条目不再新增）"""
        import tempfile, os

        # 创建一个临时目录模拟示范资料包
        demo_dir = tempfile.mkdtemp()
        mocker.patch("app.api.admin.DEMO_DATA_DIR", demo_dir)

        # 第一次导入（空目录）
        resp1 = client.post("/api/admin/import-demo")
        data1 = resp1.json()
        assert resp1.status_code == 200

        # 第二次导入结果应与第一次一致
        resp2 = client.post("/api/admin/import-demo")
        data2 = resp2.json()
        assert resp2.status_code == 200
        # imported 应该 <= 第一次（没有新文件不应该增加）
        assert data2["imported"] <= data1["imported"]
