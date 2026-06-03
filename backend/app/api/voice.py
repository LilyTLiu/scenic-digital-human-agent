from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

router = APIRouter()


class ASRResponse(BaseModel):
    text: str


class TTSRequest(BaseModel):
    text: str
    voice: str = "default"


@router.post("/asr", response_model=ASRResponse)
async def speech_to_text(file: UploadFile = File(...)):
    # TODO: 接入Whisper
    return ASRResponse(text="")


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    # TODO: 接入TTS，返回音频流
    return {"audio_url": "", "text": req.text}
