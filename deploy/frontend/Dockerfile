# ══════════════════════════════════════════════════════════════
# 前端构建：React + Vite → nginx
#
# ⚠️ 重要：不要在 Dockerfile 里用 ENV/ARG 设置 VITE_* 变量！
#    Vite 的规则：process.env 里已有同名变量时，不会读取 .env 文件。
#    ENV 会把空值写进 process.env，导致 .env 里的真实值被跳过。
#    正确做法：在 frontend/.env 里填真实值，`COPY . .` 时会一起拷贝进镜像。
#    nginx.conf 由 docker compose 的 volume 挂载（本 Dockerfile 不 COPY）。
# ══════════════════════════════════════════════════════════════

# 阶段 1：构建 React 应用
FROM node:20-alpine AS builder

WORKDIR /app

# npm 使用国内镜像加速（大陆服务器必需）
RUN npm config set registry https://registry.npmmirror.com

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# 从 frontend/.env 读取 VITE_XMOV_* / VITE_AMAP_* 变量（构建时编译进 JS）
RUN npm run build

# 阶段 2：nginx 提供静态文件
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
