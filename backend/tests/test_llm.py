"""
LLM核心逻辑 单元测试
覆盖: chat(), chat_stream(), chat_with_system() — 所有调用均mock
"""
import os
import sys
import pytest

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))


# ---------- 辅助：创建 httpx.AsyncClient mock ----------
# 关键：用 mocker.patch 获取类 mock，然后通过 .return_value 获得实例 mock
# 这样才能保证 __aenter__ / __aexit__ 正确工作

def _mock_async_client_for_chat(mocker, content: str):
    """
    为 chat() 和 chat_with_system() 创建 mock。
    chat() 中的调用链:
      async with httpx.AsyncClient(timeout=N) as client:
          resp = await client.post(...)      # ← await 获得 resp
          resp.raise_for_status()            # ← 同步调用
          data = resp.json()                 # ← 同步调用！
    """
    # 1. Mock AsyncClient 类
    MockClass = mocker.patch("httpx.AsyncClient")
    # 2. 获取实例 mock
    mock_client = MockClass.return_value
    # 3. async with 支持
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    # 4. post 必须是 AsyncMock（await 需要），但其返回 resp 需要是同步对象
    resp = mocker.MagicMock()
    resp.json.return_value = {
        "choices": [{"message": {"content": content}}]
    }
    resp.raise_for_status = lambda: None
    mock_client.post = mocker.AsyncMock(return_value=resp)
    return resp


def _mock_async_client_for_stream(mocker, lines: list[str]):
    """
    为 chat_stream() 创建 mock。
    调用链:
      async with client.stream("POST", url, ...) as resp:
          async for line in resp.aiter_lines():
    """
    async def mock_aiter_lines():
        for line in lines:
            yield line

    # stream 响应
    stream_resp = mocker.AsyncMock()
    stream_resp.aiter_lines = mock_aiter_lines
    stream_resp.raise_for_status = lambda: None

    # stream 上下文管理器
    stream_cm = mocker.AsyncMock()
    stream_cm.__aenter__.return_value = stream_resp
    stream_cm.__aexit__.return_value = None

    # Mock AsyncClient 类
    MockClass = mocker.patch("httpx.AsyncClient")
    mock_client = MockClass.return_value
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client.stream.return_value = stream_cm


class TestLLMChat:
    """chat() 函数测试"""

    def test_chat_success(self, mocker):
        """正常调用"""
        from app.core.llm import chat
        import asyncio

        _mock_async_client_for_chat(mocker, "灵山大佛高88米")
        result = asyncio.run(chat("灵山大佛有多高？"))
        assert result == "灵山大佛高88米"

    def test_chat_no_api_key(self, mocker):
        """TC-LLM-002: API Key未设置"""
        from app.core.llm import chat

        mocker.patch("app.core.llm.get_api_key", side_effect=RuntimeError("DEEPSEEK_API_KEY 未设置"))

        import asyncio
        with pytest.raises(RuntimeError) as exc_info:
            asyncio.run(chat("你好"))
        assert "未设置" in str(exc_info.value)

    def test_chat_api_error(self, mocker):
        """DeepSeek API返回错误"""
        from app.core.llm import chat

        MockClass = mocker.patch("httpx.AsyncClient")
        mock_client = MockClass.return_value
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        resp = mocker.MagicMock()
        resp.raise_for_status.side_effect = Exception("API Error")
        mock_client.post = mocker.AsyncMock(return_value=resp)

        import asyncio
        with pytest.raises(Exception):
            asyncio.run(chat("你好"))

    def test_chat_timeout(self, mocker):
        """TC-LLM-005: 超时"""
        from app.core.llm import chat

        MockClass = mocker.patch("httpx.AsyncClient")
        mock_client = MockClass.return_value
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post.side_effect = TimeoutError("Request timed out")

        import asyncio
        with pytest.raises(TimeoutError):
            asyncio.run(chat("你好"))


class TestLLMChatStream:
    """chat_stream() 函数测试"""

    def test_stream_success(self, mocker):
        """TC-LLM-003: 流式输出"""
        from app.core.llm import chat_stream

        _mock_async_client_for_stream(mocker, [
            'data: {"choices":[{"delta":{"content":"灵山"}}]}',
            'data: {"choices":[{"delta":{"content":"大佛"}}]}',
            'data: [DONE]',
        ])

        import asyncio
        tokens = []
        async def consume():
            async for token in chat_stream("测试"):
                tokens.append(token)
        asyncio.run(consume())
        assert tokens == ["灵山", "大佛"]

    def test_stream_done_signal(self, mocker):
        """流式[DONE]信号后停止"""
        from app.core.llm import chat_stream

        _mock_async_client_for_stream(mocker, [
            'data: {"choices":[{"delta":{"content":"a"}}]}',
            'data: [DONE]',
            'data: {"choices":[{"delta":{"content":"b"}}]}',
        ])

        import asyncio
        tokens = []
        async def consume():
            async for token in chat_stream("测试"):
                tokens.append(token)
        asyncio.run(consume())
        assert tokens == ["a"]

    def test_stream_malformed_json(self, mocker):
        """格式错误的JSON行被跳过"""
        from app.core.llm import chat_stream

        _mock_async_client_for_stream(mocker, [
            'data: not valid json',
            'data: {"choices":[{"delta":{"content":"正常"}}]}',
            'data: [DONE]',
        ])

        import asyncio
        tokens = []
        async def consume():
            async for token in chat_stream("测试"):
                tokens.append(token)
        asyncio.run(consume())
        assert tokens == ["正常"]


class TestLLMChatWithSystem:
    """chat_with_system() 函数测试"""

    def test_chat_with_system_basic(self, mocker):
        """TC-LLM-004: 基本调用"""
        from app.core.llm import chat_with_system

        _mock_async_client_for_chat(mocker, "欢迎来到灵山胜境")

        import asyncio
        result = asyncio.run(chat_with_system(
            system_prompt="你是灵山导游",
            user_message="你好",
        ))
        assert result == "欢迎来到灵山胜境"

    def test_chat_with_system_with_history(self, mocker):
        """带对话历史"""
        from app.core.llm import chat_with_system

        _mock_async_client_for_chat(mocker, "刚才聊了灵山大佛")

        import asyncio
        result = asyncio.run(chat_with_system(
            system_prompt="你是灵山导游",
            user_message="刚才说了什么？",
            history=[
                {"role": "user", "content": "灵山大佛有多高？"},
                {"role": "assistant", "content": "灵山大佛高88米"},
            ],
        ))
        assert "灵山大佛" in result

    def test_chat_with_system_empty_history(self, mocker):
        """空历史"""
        from app.core.llm import chat_with_system

        _mock_async_client_for_chat(mocker, "回复")

        import asyncio
        result = asyncio.run(chat_with_system(
            system_prompt="test",
            user_message="hi",
            history=[],
        ))
        assert result == "回复"

    def test_chat_with_system_history_with_empty_content(self, mocker):
        """历史记录中有空内容的条目应跳过"""
        from app.core.llm import chat_with_system

        _mock_async_client_for_chat(mocker, "回复")

        import asyncio
        result = asyncio.run(chat_with_system(
            system_prompt="test",
            user_message="hi",
            history=[
                {"role": "user", "content": ""},
                {"role": "assistant", "content": None},
            ],
        ))
        assert result == "回复"
