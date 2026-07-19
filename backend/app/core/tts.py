"""
TTS - Text to Speech
基于 edge-tts 实现文本转语音，免费且自然度高
支持 SSML 风格（style）、语速（rate）、音调（pitch）控制
连接云服务超时设为 3 秒，失败后前端自动降级到浏览器 TTS
"""
import tempfile
import os
import asyncio
from html import escape

# edge-tts 连接超时（秒）：云服务不可用时快速失败，避免用户等待
EDGE_TTS_TIMEOUT = 3


def _build_ssml(text: str, voice: str, style: str = None,
                 rate: str = "+0%", pitch: str = "+0Hz") -> str:
    """构建 SSML 增加语音表现力"""
    safe_text = escape(text)
    if style:
        return f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
  <voice name="{voice}">
    <mstts:express-as style="{style}">
      <prosody rate="{rate}" pitch="{pitch}">
        {safe_text}
      </prosody>
    </mstts:express-as>
  </voice>
</speak>"""
    else:
        return f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
  <voice name="{voice}">
    <prosody rate="{rate}" pitch="{pitch}">
      {safe_text}
    </prosody>
  </voice>
</speak>"""


async def synthesize(text: str, voice: str = "zh-CN-XiaoxiaoNeural",
                     style: str = None, rate: str = "+0%",
                     pitch: str = "+0Hz") -> bytes:
    """
    将文本合成为语音，返回MP3音频bytes
    - style: 表达风格，如 friendly/calm/gentle/cheerful 等
    - rate: 语速，如 "+10%" / "-5%"
    - pitch: 音调，如 "+5Hz" / "-8Hz"
    超时后抛出 asyncio.TimeoutError，由前端降级到浏览器 TTS
    """
    import edge_tts
    ssml = _build_ssml(text, voice, style, rate, pitch)
    communicate = edge_tts.Communicate(ssml, voice)
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
