"""
文档上传 测试用例
覆盖: TXT/DOCX上传、文件格式校验、内容解析、向量化
"""
import io
import pytest


class TestUploadDocument:
    """上传文档测试"""

    @pytest.mark.usefixtures("mock_rag_add_documents")
    def test_upload_txt(self, client, db_session):
        """TC-RAG-001: 上传TXT文件"""
        file_content = "灵山胜境位于无锡马山，是中国著名的佛教文化景区。"
        resp = client.post(
            "/api/upload/document",
            files={"file": ("test.txt", file_content.encode("utf-8"), "text/plain")},
            data={"scenic_spot": "灵山胜境", "category": "景点介绍"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "indexed"
        assert data["filename"] == "test.txt"
        assert data["size"] > 0
        assert "chunks" in data

        # 验证SQLite写入
        from app.db.database import KnowledgeDoc
        doc = db_session.query(KnowledgeDoc).filter(KnowledgeDoc.title == "test").first()
        assert doc is not None
        assert "灵山胜境" in doc.content

    @pytest.mark.usefixtures("mock_rag_add_documents")
    def test_upload_txt_gbk(self, client):
        """TC-RAG-006: GBK编码TXT"""
        file_content = "灵山胜境位于无锡".encode("gbk")
        resp = client.post(
            "/api/upload/document",
            files={"file": ("test.txt", file_content, "text/plain")},
            data={"scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "indexed"

    @pytest.mark.usefixtures("mock_rag_add_documents")
    def test_upload_docx(self, client, mocker):
        """TC-RAG-002: 上传DOCX文件"""

        # Mock python-docx 的 Document
        mock_doc = mocker.MagicMock()
        mock_para1 = mocker.MagicMock()
        mock_para1.text = "灵山胜境景区介绍段落一"
        mock_para2 = mocker.MagicMock()
        mock_para2.text = "灵山胜境景区介绍段落二"
        mock_doc.paragraphs = [mock_para1, mock_para2]

        mocker.patch("docx.Document", return_value=mock_doc)

        resp = client.post(
            "/api/upload/document",
            files={"file": ("test.docx", b"fake_docx_content", "application/octet-stream")},
            data={"scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "indexed"

    def test_upload_unsupported_format(self, client):
        """TC-RAG-003: 不支持的格式"""
        resp = client.post(
            "/api/upload/document",
            files={"file": ("test.pdf", b"fake_pdf", "application/pdf")},
            data={"scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "error"
        assert "不支持的文件格式" in data["error"]

    def test_upload_unsupported_format_png(self, client):
        """上传PNG图片"""
        resp = client.post(
            "/api/upload/document",
            files={"file": ("image.png", b"fake_png_data", "image/png")},
            data={"scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "error"

    def test_upload_empty_file(self, client):
        """TC-RAG-004: 空文件"""
        resp = client.post(
            "/api/upload/document",
            files={"file": ("empty.txt", b"", "text/plain")},
            data={"scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "error"
        assert "空" in data.get("error", "")

    @pytest.mark.usefixtures("mock_rag_add_documents")
    def test_upload_large_file(self, client):
        """TC-RAG-005: 大文件（接近50MB限制）"""
        large_content = "灵山胜境" * (5 * 1024 * 1024)  # ~30MB
        resp = client.post(
            "/api/upload/document",
            files={"file": ("large.txt", large_content.encode("utf-8"), "text/plain")},
            data={"scenic_spot": "灵山胜境"},
        )
        # 取决于FastAPI的request body大小限制
        # 默认 ~100KB，实际可能需要配置
        assert resp.status_code in (200, 413)

    def test_docx_missing_library(self, client, mocker):
        """DOCX上传但缺少python-docx"""
        import builtins
        original_import = builtins.__import__

        def mock_import(name, *args, **kwargs):
            if name == "docx":
                raise ImportError("No module named 'docx'")
            return original_import(name, *args, **kwargs)

        mocker.patch("builtins.__import__", side_effect=mock_import)

        resp = client.post(
            "/api/upload/document",
            files={"file": ("test.docx", b"fake", "application/octet-stream")},
            data={"scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "error"
        assert "python-docx" in resp.json()["error"]

    @pytest.mark.usefixtures("mock_rag_add_documents")
    def test_upload_txt_with_special_chars(self, client):
        """上传含特殊字符的TXT"""
        content = "特殊字符：Δβ∑ 符号测试！@#$%^&*()"
        resp = client.post(
            "/api/upload/document",
            files={"file": ("special.txt", content.encode("utf-8"), "text/plain")},
            data={"scenic_spot": "灵山胜境"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "indexed"
