#!/bin/bash
# ══════════════════════════════════════════════════════════════
# 灵山胜境数字人导游 — 一键部署脚本
# 用法: bash deploy/deploy.sh
# 前置: 已安装 Docker + Docker Compose
# ══════════════════════════════════════════════════════════════
set -e

echo "🚀 灵山胜境数字人导游 — 开始部署"

# 检查 .env 文件
if [ ! -f deploy/.env ]; then
    echo ""
    echo "❌ 缺少 deploy/.env 文件！"
    echo "   请先复制模板: cp deploy/.env.example deploy/.env"
    echo "   然后编辑填入 DEEPSEEK_API_KEY"
    exit 1
fi

# 加载配置
export $(grep -v '^#' deploy/.env | xargs)

# 构建 & 启动
echo "📦 构建镜像（首次需下载模型，约 5-10 分钟）…"
docker compose \
    --env-file deploy/.env \
    -f docker-compose.yml \
    build --no-cache

echo "🟢 启动服务…"
docker compose \
    --env-file deploy/.env \
    -f docker-compose.yml \
    up -d

echo ""
echo "✅ 部署完成！"
echo "   访问地址: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""
echo "   查看日志: docker compose logs -f"
echo "   停止服务: docker compose down"
