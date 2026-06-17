"""
LLM - 大模型调用
支持 DeepSeek API
"""
import httpx
import json
import os

DEEPSEEK_API_BASE = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-v4-flash"


def get_api_key():
    key = os.getenv("DEEPSEEK_API_KEY", "")
    if not key:
        raise RuntimeError(
            "DEEPSEEK_API_KEY 未设置！请先设置环境变量：\n"
            "  $env:DEEPSEEK_API_KEY='sk-...'   (PowerShell)\n"
            "  export DEEPSEEK_API_KEY='sk-...'  (Bash)"
        )
    return key


async def chat(prompt: str, temperature: float = 0.7) -> str:
    api_key = get_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": "你是一位专业的景区AI导游，热情、博学、亲切。请用中文回答，不使用任何emoji表情。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": 2048,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{DEEPSEEK_API_BASE}/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def chat_stream(prompt: str):
    api_key = get_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": "你是一位专业的景区AI导游，热情、博学、亲切。请用中文回答，不使用任何emoji表情。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 2048,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{DEEPSEEK_API_BASE}/chat/completions",
            headers=headers,
            json=payload,
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        if "content" in delta:
                            yield delta["content"]
                    except json.JSONDecodeError:
                        continue
