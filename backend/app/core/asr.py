"""ASR based on faster-whisper."""

import asyncio
import os
import tempfile
from threading import Lock

_asr_model = None
_asr_model_name = ""
_model_lock = Lock()


def _detect_audio_suffix(audio_bytes: bytes) -> str:
    """Pick a suffix that matches the browser-recorded audio container."""
    if audio_bytes.startswith(b"RIFF") and audio_bytes[8:12] == b"WAVE":
        return ".wav"
    if audio_bytes.startswith(b"\x1a\x45\xdf\xa3"):
        return ".webm"
    if audio_bytes.startswith(b"ID3") or audio_bytes[:2] == b"\xff\xfb":
        return ".mp3"
    if audio_bytes.startswith(b"OggS"):
        return ".ogg"
    return ".webm"


def get_model():
    """Lazy-load the Whisper model."""
    global _asr_model, _asr_model_name
    if _asr_model is not None:
        return _asr_model

    with _model_lock:
        if _asr_model is not None:
            return _asr_model

        # RAG defaults HuggingFace to offline mode. ASR needs first-run model
        # download unless the operator explicitly sets ASR_HF_HUB_OFFLINE=1.
        os.environ["HF_HUB_OFFLINE"] = os.getenv("ASR_HF_HUB_OFFLINE", "0")
        try:
            import huggingface_hub.constants as hf_constants

            hf_constants.HF_HUB_OFFLINE = os.environ["HF_HUB_OFFLINE"] == "1"
        except Exception:
            pass
        from faster_whisper import WhisperModel

        device = os.getenv("WHISPER_DEVICE", "cpu")
        compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
        model_candidates = [
            item.strip()
            for item in os.getenv("WHISPER_MODEL", "base").split(",")
            if item.strip()
        ]
        last_error = None
        for model_size in model_candidates:
            try:
                _asr_model = WhisperModel(model_size, device=device, compute_type=compute_type)
                _asr_model_name = model_size
                print(f"[ASR] Loaded faster-whisper model: {model_size}")
                break
            except Exception as exc:
                last_error = exc
                print(f"[ASR] Failed to load model {model_size}: {exc}")
        if _asr_model is None:
            raise RuntimeError(f"Failed to load ASR model candidates {model_candidates}: {last_error}")
    return _asr_model


def _transcribe_sync(audio_bytes: bytes, language: str | None = None) -> tuple[str, float]:
    model = get_model()

    suffix = _detect_audio_suffix(audio_bytes)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            language=language or os.getenv("ASR_LANGUAGE", "zh"),
            beam_size=int(os.getenv("ASR_BEAM_SIZE", "5")),
            best_of=int(os.getenv("ASR_BEST_OF", "5")),
            vad_filter=os.getenv("ASR_VAD_FILTER", "1") == "1",
            vad_parameters={"min_silence_duration_ms": 500},
            condition_on_previous_text=False,
            initial_prompt=os.getenv(
                "ASR_INITIAL_PROMPT",
                "以下是普通话简体中文导游问答，内容涉及无锡灵山胜境、灵山大佛、佛足坛、青铜佛足印、九龙灌浴、梵宫、五印坛城、祥符禅寺。",
            ),
            hotwords=os.getenv(
                "ASR_HOTWORDS",
                "无锡 灵山 灵山胜境 灵山大佛 佛足坛 佛足印 青铜佛足印 九龙灌浴 梵宫 五印坛城 祥符禅寺 导游 门票 演出 路线",
            ),
        )
        text = " ".join(seg.text for seg in segments)
        return text.strip(), info.language_probability
    finally:
        os.unlink(tmp_path)


async def transcribe(audio_bytes: bytes, language: str | None = None) -> tuple[str, float]:
    """Transcribe audio bytes and return text plus confidence."""
    return await asyncio.to_thread(_transcribe_sync, audio_bytes, language)
