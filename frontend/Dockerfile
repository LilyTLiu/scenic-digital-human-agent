# 阶段 1：构建 React 应用
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Vite 从 frontend/.env 文件读取 VITE_* 变量
# 不要用 ENV 覆盖 —— process.env 已有变量时 Vite 不会读取 .env 文件
RUN npm run build

# 阶段 2：nginx 提供静态文件 + API 反向代理
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
