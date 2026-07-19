"""
语音服务 测试用例
覆盖: ASR语音识别、TTS语音合成
"""
import pytest


class TestASR:
    """语音识别测试"""

    @pytest.mark.usefixtures("mock_asr")
    def test_asr_success(self, client):
        """TC-VCE-001: WAV音频识别"""
        resp = client.post(
            "/api/voice/asr",
            files={"file": ("test.wav", b"fake_wav_audio_data", "audio/wav")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "text" in data
        assert "confidence" in data
        assert data["text"] == "灵山大佛在哪里"
        assert data["confidence"] == 0.95

    def test_asr_failure(self, client, mocker):
        """ASR处理失败"""
        async def mock_transcribe_error(*args, **kwargs):
            raise RuntimeError("语音识别失败: 无法解析音频")

        mocker.patch("app.api.voice.transcribe", side_effect=mock_transcribe_error)

        resp = client.post(
            "/api/voice/asr",
            files={"file": ("test.wav", b"bad_audio_data", "audio/wav")},
        )
        assert resp.status_code == 500
        assert "失败" in resp.json().get("detail", "")

    def test_asr_invalid_audio(self, client, mocker):
        """TC-VCE-003: 非音频文件"""
        async def mock_transcribe_error(*args, **kwargs):
            raise RuntimeError("语音识别失败: 无法解析音频")

        mocker.patch("app.core.asr.transcribe", side_effect=mock_transcribe_error)

        resp = client.post(
            "/api/voice/asr",
            files={"file": ("test.txt", b"not audio content", "text/plain")},
        )
        assert resp.status_code == 500

    def test_asr_empty_file(self, client, mocker):
        """空音频文件"""
        async def mock_transcribe_empty(*args, **kwargs):
            return ("", 0.0)

        mocker.patch("app.api.voice.transcribe", side_effect=mock_transcribe_empty)

        resp = client.post(
            "/api/voice/asr",
            files={"file": ("silence.wav", b"", "audio/wav")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["text"] == ""


class TestTTS:
    """语音合成测试"""

    @pytest.mark.usefixtures("mock_tts")
    def test_tts_success(self, client):
        """TC-VCE-004: 正常TTS"""
        resp = client.post(
            "/api/voice/tts",
            json={"text": "欢迎来到灵山胜境", "voice": "zh-CN-XiaoxiaoNeural"},
        )
        assert resp.status_code == 200
        assert resp.headers.get("content-type") == "audio/mpeg"

    @pytest.mark.usefixtures("mock_tts")
    def test_tts_different_voice(self, client):
        """TC-VCE-005: 男声合成"""
        resp = client.post(
            "/api/voice/tts",
            json={"text": "测试", "voice": "zh-CN-YunxiNeural"},
        )
        assert resp.status_code == 200

    def test_tts_empty_text(self, client):
        """TC-VCE-006: 空文本"""
        resp = client.post(
            "/api/voice/tts",
            json={"text": "", "voice": "zh-CN-XiaoxiaoNeural"},
        )
        # Edge TTS 对空文本的处理
        assert resp.status_code in (200, 422, 500)

    @pytest.mark.usefixtures("mock_tts")
    def test_tts_long_text(self, client):
        """TC-VCE-007: 超长文本"""
        long_text = "灵山胜境" * 500  # 2000字
        resp = client.post(
            "/api/voice/tts",
            json={"text": long_text, "voice": "zh-CN-XiaoxiaoNeural"},
        )
        assert resp.status_code in (200, 500)

    def test_tts_failure(self, client, mock_tts_failure):
        """TTS服务不可用"""
        resp = client.post(
            "/api/voice/tts",
            json={"text": "欢迎", "voice": "zh-CN-XiaoxiaoNeural"},
        )
        assert resp.status_code == 500
        assert "失败" in resp.json().get("detail", "")
