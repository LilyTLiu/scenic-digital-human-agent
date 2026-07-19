"""
RAG核心逻辑 单元测试
覆盖: 文本切片、向量检索、prompt构建
"""
import os
import sys
import pytest

# 添加backend到路径
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))

from app.core.rag import build_prompt


class TestBuildPrompt:
    """RAG prompt构建测试"""

    def test_build_prompt_normal(self):
        """TC-RAG-CORE-003: 正常构建"""
        query = "灵山大佛有多高？"
        docs = [
            {"content": "灵山大佛高88米", "metadata": {"source": "景点库"}},
            {"content": "九龙灌浴每天10:00表演", "metadata": {"source": "景点库"}},
        ]
        prompt = build_prompt(query, docs, "灵山胜境")
        assert "灵山胜境" in prompt
        assert "【知识库内容】" in prompt
        assert "【游客问题】" in prompt
        assert "【回答要求】" in prompt
        assert "灵山大佛高88米" in prompt
        assert "九龙灌浴每天10:00表演" in prompt
        assert query in prompt
        # 检查回答要求
        assert "50-80字" in prompt

    def test_build_prompt_empty_docs(self):
        """TC-RAG-CORE-004: 空文档列表"""
        query = "未知问题"
        prompt = build_prompt(query, [], "灵山胜境")
        assert "【知识库内容】" in prompt
        assert "【游客问题】" in prompt
        assert "【回答要求】" in prompt
        assert query in prompt

    def test_build_prompt_single_doc(self):
        """单条文档"""
        docs = [{"content": "单一参考内容", "metadata": {"source": "test"}}]
        prompt = build_prompt("你好", docs, "灵山胜境")
        assert "单一参考内容" in prompt
        assert "[参考片段 1]" in prompt

    def test_build_prompt_many_docs(self):
        """多条文档（最多5条）"""
        docs = [
            {"content": f"参考片段{i}", "metadata": {}}
            for i in range(5)
        ]
        prompt = build_prompt("测试", docs, "灵山胜境")
        for i in range(5):
            assert f"参考片段{i}" in prompt
            assert f"[参考片段 {i+1}]" in prompt

    def test_build_prompt_different_scenic(self):
        """不同景区名"""
        prompt = build_prompt("有什么景点", [], "未知景区")
        assert "未知景区" in prompt

    def test_build_prompt_very_long_doc(self):
        """超长文档内容（截断处理）"""
        long_doc = "测试" * 500
        docs = [{"content": long_doc, "metadata": {"source": "test"}}]
        prompt = build_prompt("你好", docs, "灵山胜境")
        assert len(prompt) > 0
        assert "【知识库内容】" in prompt

    def test_build_prompt_special_chars_in_docs(self):
        """文档含特殊字符"""
        docs = [
            {"content": "价格: $99.99, 折扣: 50%, 温度: -5°C, 比例: 3/5", "metadata": {"source": "test"}},
            {"content": "JSON数据: {\"key\": \"value\"}, 列表: [1,2,3]", "metadata": {"source": "test"}},
            {"content": "换行符\n在这里\n测试", "metadata": {"source": "test"}},
        ]
        prompt = build_prompt("价格多少", docs, "灵山胜境")
        assert "$99.99" in prompt
        assert "换行符" in prompt
        assert "JSON" in prompt

    def test_build_prompt_docs_without_metadata(self):
        """文档没有metadata字段"""
        docs = [{"content": "纯内容无metadata"}]
        prompt = build_prompt("你好", docs, "灵山胜境")
        assert "纯内容无metadata" in prompt


class TestSearch:
    """RAG检索测试（mock ChromaDB）"""

    def test_search_empty_query(self, mocker):
        """TC-RAG-019: 空查询"""
        from app.core.rag import search

        # Mock 整个 ChromaDB 调用链
        mock_collection = mocker.MagicMock()
        mock_collection.query.return_value = {
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]],
        }

        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        results = search("lingshan", "", top_k=5)
        assert results == []

    def test_search_nonexistent_collection(self, mocker):
        """TC-RAG-020: 不存在的集合"""
        from app.core.rag import search

        mock_collection = mocker.MagicMock()
        mock_collection.query.return_value = {
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]],
        }
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        results = search("nonexistent", "test")
        assert isinstance(results, list)

    def test_search_top_k(self, mocker):
        """确保top_k参数正确传递"""
        from app.core.rag import search

        mock_collection = mocker.MagicMock()
        mock_collection.query.return_value = {
            "documents": [["a", "b"]],
            "metadatas": [[{}, {}]],
            "distances": [[0.1, 0.2]],
        }
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        results = search("lingshan", "test", top_k=2)
        assert len(results) == 2
        # score应该为 1 - distance
        assert results[0]["score"] == pytest.approx(0.9)
        assert results[1]["score"] == pytest.approx(0.8)

    def test_search_score_range(self, mocker):
        """score在0~1范围内"""
        from app.core.rag import search

        mock_collection = mocker.MagicMock()
        mock_collection.query.return_value = {
            "documents": [["a", "b", "c"]],
            "metadatas": [[{}, {}, {}]],
            "distances": [[0.0, 0.5, 0.9]],
        }
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        results = search("lingshan", "test", top_k=3)
        for r in results:
            assert 0 <= r["score"] <= 1

    def test_search_empty_collection(self, mocker):
        """TC-ERR-008: 空集合查询"""
        from app.core.rag import search

        mock_collection = mocker.MagicMock()
        mock_collection.query.return_value = {
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]],
        }
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        results = search("lingshan", "test", top_k=5)
        assert results == []

    def test_search_high_top_k(self, mocker):
        """top_k大于实际文档数"""
        from app.core.rag import search

        mock_collection = mocker.MagicMock()
        mock_collection.query.return_value = {
            "documents": [["a"]],
            "metadatas": [[{}]],
            "distances": [[0.5]],
        }
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        results = search("lingshan", "test", top_k=100)
        assert len(results) == 1  # 只有一条文档


class TestAddDocuments:
    """添加文档测试"""

    def test_add_documents_text_splitter(self, mocker, tmp_path):
        """文档切片逻辑"""
        from app.core.rag import add_documents

        # Mock ChromaDB集合
        mock_collection = mocker.MagicMock()
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        # 短文本（不切片）
        count = add_documents("test", ["短文本"])
        assert count == 1  # 1个chunk

    def test_add_documents_long_text(self, mocker, tmp_path):
        """长文本被切分成多个chunk"""
        from app.core.rag import add_documents

        mock_collection = mocker.MagicMock()
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        # 1500字文本，应切成3个chunk（500字/块 + 50 overlap）
        long_text = "灵山胜境。" * 300
        count = add_documents("test", [long_text])
        assert count > 1

    def test_add_documents_multiple_docs(self, mocker):
        """多个文档"""
        from app.core.rag import add_documents

        mock_collection = mocker.MagicMock()
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        count = add_documents("test", ["文档一", "文档二", "文档三"])
        assert count == 3

    def test_add_documents_with_metadata(self, mocker):
        """带metadata的添加"""
        from app.core.rag import add_documents

        mock_collection = mocker.MagicMock()
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        count = add_documents("test", ["内容"], [{"source": "test.txt", "category": "测试"}])
        assert count == 1
        # 验证metadata被传递
        call_args = mock_collection.add.call_args
        assert call_args is not None
        assert "metadatas" in call_args.kwargs

    def test_add_documents_empty(self, mocker):
        """空文档列表"""
        from app.core.rag import add_documents

        mock_collection = mocker.MagicMock()
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        count = add_documents("test", [])
        assert count == 0
        mock_collection.add.assert_not_called()

    def test_add_documents_special_chars(self, mocker):
        """含特殊字符的文档"""
        from app.core.rag import add_documents

        mock_collection = mocker.MagicMock()
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        special_content = "价格: ¥99.99\n折扣: 50% off\n符号: ☯★♠♥♦♣"
        count = add_documents("test", [special_content])
        assert count == 1

    def test_add_documents_metadata_mismatch(self, mocker):
        """metadata列表与documents不匹配时的处理（不传metadata时使用空字典）"""
        from app.core.rag import add_documents

        mock_collection = mocker.MagicMock()
        mocker.patch("app.core.rag.create_knowledge_base", return_value=mock_collection)

        # 不传metadata（使用默认None）
        count = add_documents(
            "test",
            ["文档一", "文档二", "文档三"],
        )
        assert count == 3
