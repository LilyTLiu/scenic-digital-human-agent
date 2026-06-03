"""
ASR - Automatic Speech Recognition
基于 faster-whisper 实现语音转文本
"""
import os
import tempfile

# 懒加载模型
_asr_model = None


def get_model():
    global _asr_model
    if _asr_model is None:
        from faster_whisper import WhisperModel
        model_size = os.getenv("WHISPER_MODEL", "base")
        _asr_model = WhisperModel(model_size, device="cpu", compute_type="int8")
    return _asr_model


async def transcribe(audio_bytes: bytes, language: str = "zh") -> tuple[str, float]:
    """将音频转写为文本，返回(文本, 置信度)"""
    model = get_model()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
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
