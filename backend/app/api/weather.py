from fastapi import APIRouter
import httpx
from app.config import settings

router = APIRouter(tags=["天气"])

@router.get("/weather")
async def get_weather(city: str = "320200"):
    """代理高德天气 REST API，避免前端跨域问题"""
    key = settings.AMAP_KEY
    if not key:
        return {"error": "AMAP_KEY not configured"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://restapi.amap.com/v3/weather/weatherInfo",
            params={"key": key, "city": city, "extensions": "base"},
        )
        data = resp.json()
        if data.get("lives") and data["lives"][0]:
            return data["lives"][0]
        return {"error": "weather fetch failed", "info": data.get("info")}
