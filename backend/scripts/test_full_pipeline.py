"""
端到端测试脚本: RAG检索 + DeepSeek LLM + 回答生成
需要先设置环境变量 DEEPSEEK_API_KEY
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.rag import search, build_prompt
from app.core.llm import chat


async def main():
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key:
        print("=" * 60)
        print("[NO KEY] DEEPSEEK_API_KEY not set")
        print("=" * 60)
        print()
        print("Get your key at: https://platform.deepseek.com/api_keys")
        print("Then: set DEEPSEEK_API_KEY=your_key_in_shell")
        print()
        print("Running RAG-only test (no LLM calling)...")
        print()
        test_rag_only()
        return

    print("=" * 60)
    print("END-TO-END TEST: RAG + DeepSeek")
    print("=" * 60)

    questions = [
        "灵山大佛有多高？",
        "九龙灌浴的表演时间是几点？",
        "请帮我推荐一条适合带小朋友的游览路线",
        "灵山胜境有什么历史文化背景？",
        "梵宫里面有什么值得看的？",
    ]

    for i, q in enumerate(questions, 1):
        print(f"\n{'=' * 50}")
        print(f"Test #{i}: {q}")
        print(f"{'=' * 50}")

        # RAG retrieval
        results = search("lingshan", q, top_k=3)
        print(f"\n[KB] Top {len(results)} results:")
        for j, r in enumerate(results):
            snippet = r['content'][:100].replace('\n', ' ')
            print(f"  [{j+1}] score={r['score']:.3f} | {snippet}...")

        # LLM generation
        prompt = build_prompt(q, results, "灵山胜境")
        print(f"\n[LLM] Calling DeepSeek...")
        try:
            reply = await chat(prompt)
            # Encode to avoid GBK terminal issues
            safe_reply = reply[:300].encode('utf-8', errors='replace').decode('utf-8', errors='replace')
            print(f"\n[AI]: {safe_reply}{'...' if len(reply) > 300 else ''}")
            print(f"PASS #{i} (len={len(reply)})")
        except Exception as e:
            print(f"FAIL #{i}: {str(e).encode('utf-8', errors='replace').decode('utf-8')}")


def test_rag_only():
    questions = [
        ("灵山大佛有多高？", "灵山大佛的基本信息"),
        ("九龙灌浴的表演时间", "九龙灌浴表演信息"),
        ("亲子游览路线推荐", "亲子路线相关内容"),
        ("灵山胜境的历史", "历史背景信息"),
    ]
    for q, desc in questions:
        results = search("lingshan", q, top_k=3)
        print(f"Q: '{q}' (expecting: {desc})")
        for j, r in enumerate(results):
            snippet = r['content'][:120].replace('\n', ' ')
            print(f"  [{j+1}] score={r['score']:.3f} | {snippet}...")
        print()


if __name__ == "__main__":
    asyncio.run(main())
