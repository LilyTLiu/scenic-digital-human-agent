"""
LLM - 大模型调用
支持多模态大模型API调用（Qwen-VL-Max / DeepSeek等）
"""
import httpx
import os


LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_API_BASE = os.getenv("LLM_API_BASE", "https://dashscope.aliyuncs.com/compatible-mode/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen-plus")

# 也支持DeepSeek API
# LLM_API_BASE = "https://api.deepseek.com/v1"
# LLM_MODEL = "deepseek-chat"


async def chat(prompt: str, temperature: float = 0.7) -> str:
    """调用大模型进行对话"""
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": "你是一位专业的景区AI导游，热情、博学、亲切。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": 2000,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{LLM_API_BASE}/chat/completions",
            headers=headers,
            json=payload,
        )
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def chat_stream(prompt: str):
    """流式对话"""
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": "你是一位专业的景区AI导游，热情、博学、亲切。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "POST",
            f"{LLM_API_BASE}/chat/completions",
            headers=headers,
            json=payload,
        ) as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data: ") and not line.startswith("data: [DONE]"):
                    import json
                    chunk = json.loads(line[6:])
                    if chunk["choices"][0].get("delta", {}).get("content"):
                        yield chunk["choices"][0]["delta"]["content"]
