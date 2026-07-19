"""
ASR - Automatic Speech Recognition
基于 faster-whisper 实现语音转文本
"""
import os
import tempfile
import subprocess

_asr_model = None


def get_model():
    """懒加载Whisper模型"""
    global _asr_model
    if _asr_model is None:
        from faster_whisper import WhisperModel
        model_size = os.getenv("WHISPER_MODEL", "base")
        _asr_model = WhisperModel(model_size, device="cpu", compute_type="int8")
    return _asr_model


async def transcribe(audio_bytes: bytes, language: str = "zh") -> tuple[str, float]:
    """将音频转写为文本，返回(文本, 置信度)"""
    model = get_model()

    # 保存临时文件，用原始格式让 ffmpeg 自行检测
    with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            language=language,
            beam_size=5,
            vad_filter=True,
        )
        text = " ".join(seg.text for seg in segments)
        return text.strip(), info.language_probability
    finally:
        os.unlink(tmp_path)
