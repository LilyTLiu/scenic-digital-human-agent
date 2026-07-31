# 灵山胜境数字人导游 — 生产部署指南

本目录是一个**自包含的部署文件夹**：所有部署配置集中在此，通过 `build.context` 指向源码目录构建，拿这一个文件夹 + 源码即可完成部署。

## 📁 文件说明

```
deploy/                       ← 部署文件夹（自包含）
├── docker-compose.yml        # 服务编排（后端 + 前端 + 持久化卷 + HTTPS）
├── frontend/
│   ├── Dockerfile            # 前端构建（React + Vite → nginx）
│   └── nginx.conf            # HTTP/HTTPS 双协议 + API 反向代理（volume 挂载）
├── backend/
│   └── Dockerfile            # 后端构建（FastAPI，含国内镜像加速）
├── certs/                    # HTTPS 证书（deploy.sh 自动生成）
├── .env.example              # 环境变量模板（复制为 deploy/.env）
├── deploy.sh                 # 一键部署脚本
└── README.md                 # 本文档
```

**依赖的仓库根目录内容**（构建上下文，不在本文件夹）：
- `backend/` 后端源码
- `frontend/` 前端源码 + `frontend/.env`（Vite 变量，不入 Git）
- `示范景区公开资料包/` 知识库 Word 源文件

> 根目录的 `backend/Dockerfile`、`frontend/Dockerfile`、`frontend/nginx.conf`、`docker-compose.yml` 是源码自带的等价副本，供本地/其他流程使用；生产部署统一用本 `deploy/` 文件夹。

## ⚙️ 环境要求

| 项 | 要求 |
|---|---|
| 服务器 | Linux（推荐 Ubuntu/Debian），**2C4G 及以上** |
| Docker | ≥ 24 |
| Docker Compose | ≥ 2.20（`docker compose` 插件版） |
| 端口 | 80、443（阿里云需在安全组开放） |

> 为什么 2C4G：后端预下载的 faster-whisper(base) + embedding 模型内存占用约 2GB+，2C2G 会 OOM。

## 🚀 快速部署

### 1. 准备服务器

```bash
# 安装 Docker（中国大陆镜像源）
curl -fsSL https://get.docker.com | bash
systemctl enable docker && systemctl start docker

# Docker Hub 镜像加速
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
EOF
systemctl restart docker
```

### 2. 上传代码

```bash
git clone https://github.com/你的仓库/scenic-digital-human-agent.git
cd scenic-digital-human-agent
```

### 3. 配置环境变量

```bash
# 后端变量（必填 DEEPSEEK_API_KEY）
cp deploy/.env.example deploy/.env
nano deploy/.env
```

```bash
# 前端变量（魔珐星云数字人 + 高德地图）
cp frontend/.env.example frontend/.env
nano frontend/.env
```

| 变量 | 必填 | 获取位置 |
|---|---|---|
| `DEEPSEEK_API_KEY` | ✅ | https://platform.deepseek.com |
| `VITE_XMOV_APP_ID` / `VITE_XMOV_APP_SECRET` | 可选 | 魔珐星云开放平台 |
| `VITE_AMAP_KEY` / `VITE_AMAP_SECRET` | 可选 | 高德开放平台 |

### 4. 一键部署

```bash
bash deploy/deploy.sh
```

脚本自动完成：生成 HTTPS 证书 → 构建镜像 → 启动服务 → 导入知识库。

### 5. 访问

| 入口 | 地址 |
|---|---|
| 游客端 | `https://服务器IP`（**必须 HTTPS**，数字人才能渲染） |
| 管理后台 | `https://服务器IP/admin` |
| API 文档 | `https://服务器IP/docs` |

> 自签名证书首次访问会警告，点「高级」→「继续访问」即可。
> 有域名可换 Let's Encrypt 免费证书（见下文）。

## 🔧 关键说明

### 为什么必须 HTTPS？

魔珐星云数字人 SDK 使用浏览器 **WebCodecs API（`VideoDecoder`）** 解码数字人视频流。该 API **只在安全上下文（HTTPS 或 localhost）可用**。纯 HTTP 下数字人无法显示，控制台报错 `VideoDecoder is not defined`。

### 为什么 Dockerfile 里不能设 VITE_* 变量？

Vite 构建规则：**`process.env` 已有同名变量时不读取 `.env` 文件**。Dockerfile 的 `ENV VITE_XMOV_APP_ID=$VITE_XMOV_APP_ID` 会把空值写入 `process.env`，导致 `.env` 里的真实值被跳过。正确做法是让 Vite 直接读 `frontend/.env`（`COPY . .` 已包含）。

### 数据持久化

- SQLite 数据库 + ChromaDB 向量库保存在 Docker 卷 `lingshan_data`。
- 重建镜像、重启容器**不会丢失**数据。
- 删除卷会清空数据：`docker compose down -v`（谨慎！）

### 更新部署

```bash
git pull origin main
bash deploy/deploy.sh
```

## 🧠 常见问题

### 数字人看不到脸
1. 必须用 `https://` 访问（非 http）
2. 浏览器 F12 → Console 无 `VideoDecoder is not defined`
3. `frontend/.env` 里 VITE_XMOV 变量已填且重建过前端

### 地图显示「未配置」
`frontend/.env` 里 `VITE_AMAP_KEY` 未填或填错，改后需重建前端。

### 后端无法启动 / 内存不足
检查 `free -h`，2C2G 建议关闭无关服务，或减小 Whisper 模型（`WHISPER_MODEL=tiny`）。

### 国内拉取 Docker 镜像慢
配置 `/etc/docker/daemon.json` 镜像加速后重启 Docker。

## 🔒 安全说明

- `deploy/.env` 和 `frontend/.env` 含真实密钥，**不要提交到 Git**。
- 自签名证书仅供测试演示，生产环境建议用 Let's Encrypt：
  ```bash
  # 有域名时
  apt install certbot
  certbot certonly --standalone -d your-domain.com
  cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/
  cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/
  ```
