from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from app.core.asr import transcribe
from app.core.tts import synthesize

router = APIRouter()


class ASRResponse(BaseModel):
    text: str
    confidence: float = 0.0


class TTSRequest(BaseModel):
    text: str
    voice: str = "zh-CN-XiaoxiaoNeural"


@router.post("/asr", response_model=ASRResponse)
async def speech_to_text(file: UploadFile = File(...)):
    """语音转文本"""
    try:
        audio_bytes = await file.read()
        text, confidence = await transcribe(audio_bytes)
        return ASRResponse(text=text, confidence=round(confidence, 3))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语音识别失败: {str(e)}")


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """文本转语音 - 返回mp3音频流"""
    try:
        audio_bytes = await synthesize(req.text, voice=req.voice)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语音合成失败: {str(e)}")
