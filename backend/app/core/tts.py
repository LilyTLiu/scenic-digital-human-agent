"""
TTS - Text to Speech
基于 edge-tts 实现文本转语音，免费且自然度高
"""
import tempfile
import os


async def synthesize(text: str, voice: str = "zh-CN-XiaoxiaoNeural") -> bytes:
    """将文本合成为语音，返回MP3音频bytes"""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        tmp_path = f.name

    try:
        await communicate.save(tmp_path)
        with open(tmp_path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
