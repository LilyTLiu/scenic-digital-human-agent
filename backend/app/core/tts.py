"""Configurable text-to-speech backends."""

import base64
import os
from dataclasses import dataclass

import httpx


VOICE_MAP = {
    # 前端 edge-tts 声线 → Sambert 音色
    "zh-CN-XiaoxiaoNeural": "zhitian",   # 活泼女 → 知甜
    "zh-CN-XiaoyiNeural":    "zhichu",    # 温柔女 → 知初
    "zh-CN-YunxiNeural":     "zhimo",     # 沉稳男 → 知陌
    "zh-CN-YunjianNeural":   "zhimo",     # 成熟男 → 知陌
}


@dataclass
class SynthesizedAudio:
    content: bytes
    media_type: str = "audio/mpeg"
    filename: str = "speech.mp3"


async def _synthesize_edge(text: str, voice: str) -> SynthesizedAudio:
    import edge_tts

    communicate = edge_tts.Communicate(text, voice)
    audio = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
    if not audio:
        raise RuntimeError("edge-tts 未返回音频数据")
    return SynthesizedAudio(bytes(audio), "audio/mpeg", "speech.mp3")


async def _synthesize_dashscope(text: str, voice: str) -> SynthesizedAudio:
    """DashScope Sambert TTS. This is cloud-hosted, not an open-source model."""

    api_key = os.environ.get("DASHSCOPE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("DASHSCOPE_API_KEY 未设置！")

    from dashscope.audio.tts import SpeechSynthesizer

    dashscope_voice = VOICE_MAP.get(voice, "zhitian")

    result = SpeechSynthesizer.call(
        model="sambert-zhichu-v1",
        text=text,
        voice=dashscope_voice,
        format="mp3",
        api_key=api_key,
    )

    if result.get_response().status_code != 200:
        raise RuntimeError(
            f"DashScope TTS error {result.get_response().status_code}: {result.get_response().message}"
        )

    audio = result.get_audio_data()
    if not audio:
        raise RuntimeError("DashScope TTS 未返回音频数据")
    return SynthesizedAudio(audio, "audio/mpeg", "speech.mp3")


async def _synthesize_local_http(text: str, voice: str) -> SynthesizedAudio:
    """Call a local open-source TTS service such as CosyVoice or MeloTTS."""
    url = os.getenv("TTS_LOCAL_HTTP_URL", "http://127.0.0.1:9880/tts").strip()
    payload = {
        "text": text,
        "voice": voice,
        "speaker": os.getenv("TTS_LOCAL_SPEAKER", ""),
        "format": os.getenv("TTS_LOCAL_FORMAT", "wav"),
    }
    async with httpx.AsyncClient(timeout=float(os.getenv("TTS_TIMEOUT", "120"))) as client:
        resp = await client.post(url, json=payload)
    resp.raise_for_status()

    content_type = resp.headers.get("content-type", "").split(";")[0].strip()
    if content_type.startswith("audio/"):
        extension = "wav" if "wav" in content_type else "mp3"
        return SynthesizedAudio(resp.content, content_type, f"speech.{extension}")

    data = resp.json()
    audio_b64 = data.get("audio") or data.get("audio_base64")
    if not audio_b64:
        raise RuntimeError("本地 TTS 服务未返回 audio/audio_base64 字段或音频流")
    media_type = data.get("media_type") or data.get("mime_type") or "audio/wav"
    extension = "wav" if "wav" in media_type else "mp3"
    return SynthesizedAudio(base64.b64decode(audio_b64), media_type, f"speech.{extension}")


async def synthesize(text: str, voice: str = "zh-CN-XiaoxiaoNeural") -> SynthesizedAudio:
    """文本合成为音频。TTS_PROVIDER=edge|dashscope|local_http"""
    provider = os.getenv("TTS_PROVIDER", "edge").strip().lower()

    if provider == "edge":
        return await _synthesize_edge(text, voice)
    if provider == "dashscope":
        return await _synthesize_dashscope(text, voice)
    if provider in {"local", "local_http", "cosyvoice", "melotts"}:
        return await _synthesize_local_http(text, voice)

    raise RuntimeError(f"未知 TTS_PROVIDER: {provider}")
