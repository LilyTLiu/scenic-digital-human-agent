"""
TTS - Text to Speech
基于 edge-tts 实现文本转语音，免费且自然度高
连接云服务超时设为 12 秒，失败后前端自动降级到浏览器 TTS
注意：edge-tts（免费版）对 SSML 支持不完整，使用纯文本避免标签被朗读
"""
import tempfile
import os
import asyncio

# edge-tts 连接超时（秒）：云服务不可用时快速失败，避免用户等待
EDGE_TTS_TIMEOUT = 12


async def synthesize(text: str, voice: str = "zh-CN-XiaoxiaoNeural",
                     style: str = None, rate: str = "+0%",
                     pitch: str = "+0Hz") -> bytes:
    """
    将文本合成为语音，返回MP3音频bytes
    - voice: edge-tts 声线名称
    - rate: 语速，如 "+10%" / "-5%"
    - pitch: 音调，如 "+5Hz" / "-8Hz"
    - style: edge-tts 免费版不支持 <mstts:express-as>，保留参数但不使用
    """
    import edge_tts
    # edge-tts 免费 API 对 SSML 支持不完整（尤其 <mstts:express-as> 会触发 SSML 被当作纯文本逐字朗读）
    # 直接用纯文本，通过 rate/pitch 参数控制语速音调
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch,
    )
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        tmp_path = f.name

    try:
        await asyncio.wait_for(communicate.save(tmp_path), timeout=EDGE_TTS_TIMEOUT)
        with open(tmp_path, "rb") as f:
            return f.read()
    except asyncio.TimeoutError:
        raise RuntimeError("TTS 云服务连接超时，已降级到浏览器语音")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
