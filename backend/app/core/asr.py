"""
ASR - Automatic Speech Recognition
基于 faster-whisper 实现语音转文本
"""
import os
import tempfile
import subprocess
import shutil

_asr_model = None
_ffmpeg = shutil.which("ffmpeg")


def get_model():
    """懒加载Whisper模型"""
    global _asr_model
    if _asr_model is None:
        from faster_whisper import WhisperModel
        model_size = os.getenv("WHISPER_MODEL", "base")
        _asr_model = WhisperModel(model_size, device="cpu", compute_type="int8")
    return _asr_model


def _convert_to_wav(input_path: str, output_path: str) -> bool:
    """用 ffmpeg 将任意音频转为 16kHz 单声道 PCM WAV"""
    try:
        subprocess.run(
            [_ffmpeg, "-y", "-i", input_path,
             "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", output_path],
            capture_output=True, check=True, timeout=30,
        )
        return True
    except Exception:
        return False


async def transcribe(audio_bytes: bytes, language: str = "zh") -> tuple[str, float]:
    """将音频转写为文本，返回(文本, 置信度)"""
    model = get_model()

    # 保存原始音频（前端 MediaRecorder 产 webm，不是 wav）
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(audio_bytes)
        raw_path = f.name

    wav_path = raw_path + ".wav"

    try:
        # 转成标准 WAV（16k mono PCM），faster-whisper 才能正确解码
        if _ffmpeg and _convert_to_wav(raw_path, wav_path):
            transcribe_path = wav_path
        else:
            # fallback: 没有 ffmpeg 时直接试（浏览器可能产真实 wav）
            transcribe_path = raw_path

        segments, info = model.transcribe(
            transcribe_path,
            language=language,
            beam_size=5,
            vad_filter=True,
        )
        text = " ".join(seg.text for seg in segments)
        return text.strip(), info.language_probability
    finally:
        if os.path.exists(raw_path):
            os.unlink(raw_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)
