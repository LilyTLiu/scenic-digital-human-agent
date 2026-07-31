#!/bin/bash
# ══════════════════════════════════════════════════════════════
# 灵山胜境数字人导游 — 一键部署脚本
# 用法: 在仓库根目录执行  bash deploy/deploy.sh
# 前置:
#   1. 已安装 Docker + Docker Compose
#   2. 已填写 deploy/.env（至少 DEEPSEEK_API_KEY）
#   3. 前端变量 frontend/.env（脚本自动从 .env.example 复制，确认已填 VITE_XMOV/AMAP）
#   4. 脚本自动生成 HTTPS 自签名证书
# ══════════════════════════════════════════════════════════════
set -e

echo "🚀 灵山胜境数字人导游 — 开始部署"
cd "$(dirname "$0")/.."   # 切到仓库根目录

# ── 检查 deploy/.env ──
if [ ! -f deploy/.env ]; then
    echo ""
    echo "❌ 缺少 deploy/.env 文件！"
    echo "   请先复制模板: cp deploy/.env.example deploy/.env"
    echo "   然后编辑填入 DEEPSEEK_API_KEY"
    exit 1
fi

# ── 检查 DEEPSEEK_API_KEY 是否已填 ──
if grep -q "DEEPSEEK_API_KEY=sk-your-key-here" deploy/.env; then
    echo ""
    echo "❌ deploy/.env 里 DEEPSEEK_API_KEY 还是占位符！"
    echo "   请编辑: nano deploy/.env"
    exit 1
fi

# ── 前端变量：确保 frontend/.env 存在（Vite 构建时读取）──
# ⚠️ 关键：Dockerfile 里不能用 ENV 覆盖 VITE_*，必须靠 .env 文件
if [ ! -f frontend/.env ]; then
    echo "📝 生成 frontend/.env（Vite 构建变量）…"
    cp frontend/.env.example frontend/.env
    echo "   ⚠️ 请确认 frontend/.env 里的 VITE_XMOV_APP_ID / VITE_AMAP_KEY 已填"
    echo "      （如未填: nano frontend/.env）"
fi

# ── HTTPS 证书（数字人渲染必需）──
if [ ! -f certs/fullchain.pem ]; then
    echo "🔐 生成自签名 HTTPS 证书…"
    mkdir -p certs
    SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "127.0.0.1")
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout certs/privkey.pem \
        -out certs/fullchain.pem \
        -subj "/CN=$SERVER_IP"
    echo "   证书已生成（有效期 365 天）"
fi

# ── 构建 & 启动 ──
echo "📦 构建镜像（首次需下载模型，约 5-10 分钟）…"
docker compose \
    --env-file deploy/.env \
    build --no-cache

echo "🟢 启动服务…"
docker compose \
    --env-file deploy/.env \
    up -d

# ── 等待后端就绪 ──
echo "⏳ 等待后端启动…"
sleep 15

# ── 导入知识库（幂等，可重复执行）──
echo "📚 导入知识库…"
if [ -d "示范景区公开资料包" ]; then
    docker exec lingshan-backend python scripts/rebuild_demo_knowledge.py || echo "   ⚠️ 知识库导入跳过（可稍后手动执行）"
else
    echo "   ⚠️ 未找到 示范景区公开资料包 目录，跳过知识库导入"
fi

echo ""
echo "✅ 部署完成！"
SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
echo "   HTTP:  http://${SERVER_IP}"
echo "   HTTPS: https://${SERVER_IP}   ← 数字人必须用这个（点高级→继续访问）"
echo "   管理后台: http://${SERVER_IP}/admin"
echo ""
echo "   查看日志: docker compose logs -f"
echo "   停止服务: docker compose down"
echo "   更新代码: git pull origin main && bash deploy/deploy.sh"
