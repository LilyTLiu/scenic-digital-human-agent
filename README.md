# AI数字人智能导游系统

"中国软件杯" 2026年赛题 A5 — 基于多模态大模型的智慧景区导览系统。

以无锡灵山胜境为示范景区，集成 RAG 知识库、DeepSeek 大模型、3D 数字人实时渲染、语音交互等技术，为游客提供智能问答、景区导览、路线推荐、数字人讲解等服务。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Python FastAPI + Uvicorn |
| 数据库 | SQLite (SQLAlchemy ORM) |
| 向量检索 | ChromaDB + sentence-transformers (text2vec-base-chinese) |
| 大模型 | DeepSeek API (OpenAI 兼容接口) |
| 语音合成 | Edge-TTS + Web Speech API |
| 语音识别 | faster-whisper (后端) + SenseVoice (OAC 端) |
| 3D 数字人 | OpenAvatarChat (LAM 大型头像模型) |
| 前端框架 | React 18 + TypeScript + Vite 5 |
| UI 组件 | Ant Design 5 |

## 功能概要

### 游客端
- **智能问答** — RAG 检索增强 + DeepSeek 生成，覆盖灵山 10+ 景点知识
- **语音对话** — 语音输入 (ASR) + 语音播报 (TTS)，支持 4 种导游声线
- **景区导览** — 手绘风格地图，10 个景点标记，点击查看详细介绍 + 语音讲解
- **路线推荐** — 3 条主题路线（历史文化/自然风光/亲子），含时间规划和行程
- **AI 数字人** — 3D 数字人实时渲染，口型同步，表情驱动
- **用户系统** — 手机号登录注册，个性化偏好设置

### 管理后台 (`/admin`)
- **数据大屏** — 今日/本周服务人次、热门问答、7 天趋势
- **知识库管理** — 增删改查知识条目，一键导入示范资料包 .docx 文件
- **数字人形象管理** — 4 角色可视化切换，实时生效
- **游客管理** — 注册游客列表，对话统计
- **反馈报告** — 满意度统计，每日趋势

### 4 位 AI 导游

| 角色 | 声线 | 风格 | 适用场景 |
|------|------|------|----------|
| 小灵 | zh-CN-XiaoxiaoNeural | 热情专业 | 通用导览 |
| 小山 | zh-CN-YunxiNeural | 沉稳博学 | 深度文化讲解 |
| 妙音 | zh-CN-XiaoyiNeural | 优雅灵动 | 艺术鉴赏 |
| 小禅 | zh-CN-YunjianNeural | 禅意智慧 | 禅修体验 |

## 快速开始

### 环境要求

| 工具 | 最低版本 |
|------|----------|
| Python | >= 3.10 |
| Node.js | >= 18 |
| npm | >= 9 |

### 1. 克隆仓库

```bash
git clone https://github.com/LilyTLiu/scenic-digital-human-agent.git
cd scenic-digital-human-agent
```

### 2. 后端

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置 API Key
cp .env.example .env
# 编辑 .env，填写 DEEPSEEK_API_KEY=你的密钥

# 启动后端
python main.py
# → http://localhost:8000
# → API 文档: http://localhost:8000/docs
```

### 3. 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → https://localhost:5173  (自签名证书，用于麦克风权限)
```

### 4. 访问

浏览器打开 `https://localhost:5173`：
- 游客端：底部导航切换"导览""问答""AI导游""路线""我的"
- 管理后台：`https://localhost:5173/admin`

首次使用建议先进入管理后台，点击"导入示例资料"将灵山知识库加载到向量数据库。

### 5. 3D 数字人（可选）

如需启用 3D 数字人实时渲染，需要额外部署 OpenAvatarChat：

```bash
# 1. 安装 OpenAvatarChat (需 conda 环境)
git clone https://github.com/OpenAvatarChat/OpenAvatarChat.git
cd OpenAvatarChat
conda env create -f environment.yml
conda activate oac

# 2. 将 代码包/OAC-config/lingshan_http.yaml 复制到 OpenAvatarChat/config/

# 3. 启动 OAC
python src/demo.py --config config/lingshan_http.yaml

# 4. 前端配置代理（vite.config.ts 已预配置 /oac → localhost:8787）
```

数字人页面位于 `/tourist/digital-human`，角色随管理后台切换实时生效。

## 项目结构

```
├── backend/
│   ├── main.py                    # 后端入口
│   ├── requirements.txt
│   ├── .env.example               # API Key 配置模板
│   ├── app/
│   │   ├── app.py                 # FastAPI 应用工厂
│   │   ├── config.py              # 配置管理
│   │   ├── api/
│   │   │   ├── chat.py            # 对话接口（含 OAC LLM 端点）
│   │   │   ├── voice.py           # TTS / ASR 接口
│   │   │   ├── admin.py           # 管理后台接口
│   │   │   ├── upload.py          # 文件上传
│   │   │   └── user.py            # 用户系统
│   │   ├── core/
│   │   │   ├── llm.py             # DeepSeek API 封装
│   │   │   ├── rag.py             # RAG 检索 + Prompt 构建
│   │   │   ├── tts.py             # Edge-TTS 合成
│   │   │   ├── asr.py             # faster-whisper 识别
│   │   │   └── digital_human.py   # 数字人配置
│   │   └── db/
│   │       └── database.py        # SQLAlchemy 模型 + Session
│   ├── chroma_db/                 # 向量数据库（预置知识库）
│   └── scripts/
│       └── build_knowledge_base.py # 重建知识库
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                # 路由定义
│       ├── main.tsx
│       ├── components/            # 通用组件
│       │   ├── DigitalHuman.tsx   # SVG 数字人
│       │   ├── DigitalHuman3D.tsx # 3D 数字人 (Three.js)
│       │   ├── LoginModal.tsx     # 登录弹窗
│       │   └── ProfileDrawer.tsx  # 个人中心抽屉
│       ├── pages/
│       │   ├── tourist/           # 游客端页面
│       │   │   ├── HomePage.tsx
│       │   │   ├── ChatPage.tsx
│       │   │   ├── TourPage.tsx
│       │   │   ├── RecommendPage.tsx
│       │   │   ├── DigitalHumanPage.tsx
│       │   │   ├── FAQPage.tsx
│       │   │   └── Layout.tsx
│       │   └── admin/             # 管理后台页面
│       │       ├── Dashboard.tsx
│       │       ├── KnowledgeBase.tsx
│       │       ├── DigitalHuman.tsx
│       │       ├── ReportPage.tsx
│       │       └── Layout.tsx
│       ├── config/
│       │   └── personas.ts        # 4 角色定义（声线/外观/风格）
│       ├── contexts/
│       │   └── UserContext.tsx     # 用户登录态管理
│       ├── services/
│       │   └── api.ts             # API 客户端封装
│       └── utils/
│           └── voice.ts           # 浏览器语音匹配
├── 代码包/
│   ├── OAC-config/                # OpenAvatarChat 配置文件
│   ├── 需求分析-修订版.docx
│   ├── 详细设计.docx
│   └── 数据库实现.docx
├── 示范景区公开资料包/             # 灵山胜境原始 docx 资料
├── .gitignore
└── README.md
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat/send` | 发送对话消息 |
| POST | `/api/chat/v1` | OpenAI 兼容端点（供 OAC 调用） |
| GET | `/api/chat/history` | 获取对话历史 |
| POST | `/api/voice/tts` | 文本转语音 |
| POST | `/api/voice/asr` | 语音转文本 |
| POST | `/api/user/login` | 手机号登录 |
| GET | `/api/user/profile` | 获取用户信息 |
| PUT | `/api/user/profile` | 更新用户偏好 |
| GET | `/api/admin/dashboard` | 数据大屏统计 |
| GET/POST/PUT/DELETE | `/api/admin/knowledge` | 知识库 CRUD |
| POST | `/api/admin/import-demo` | 导入示例资料 |
| GET | `/api/admin/digital-humans` | 列出数字人角色 |
| PUT | `/api/admin/digital-humans/:id` | 切换数字人 |
| GET | `/api/admin/reports` | 反馈报告 |
| GET | `/api/admin/tourists` | 游客列表 |
| POST | `/api/upload/image` | 上传图片 |

## 配置说明

### 环境变量 (`backend/.env`)

```env
DEEPSEEK_API_KEY=your-api-key-here    # DeepSeek API 密钥（必填）
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

### 默认角色

系统默认使用"妙音"（优雅灵动女导游）。可通过管理后台 `/admin/digital-human` 切换，切换后对话提示词、OAC 数字人形象、TTS 声线同步更新。

### 局域网访问

```bash
# 前端 (Vite)
# vite.config.ts 已配置 host: '0.0.0.0' + HTTPS
# 同一 WiFi 下其他设备通过本机 IP 访问：
https://<本机IP>:5173

# 查看本机 IP
python -c "import socket; s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.connect(('10.255.255.255',1)); print(s.getsockname()[0])"
```

首次访问需信任自签名证书（浏览器 → 高级 → 继续前往）。麦克风权限需要 HTTPS 环境。

## 开发说明

### 知识库重建

```bash
cd backend
# 首次需联网下载 embedding 模型 (~400MB)
$env:HF_HUB_OFFLINE="0"  # PowerShell
python scripts/build_knowledge_base.py
# 之后设置为离线模式
$env:HF_HUB_OFFLINE="1"
```

预置的 `chroma_db/` 已包含灵山胜境知识库（62 个文本片段），通常无需重建。

### 向量模型

使用 `shibing624/text2vec-base-chinese`，768 维。首次运行自动从 HuggingFace 缓存加载，设置 `HF_HUB_OFFLINE=1` 禁用联网检查。

### 数据库

SQLite 单文件 `backend/data.db`，6 张表：
- `users` — 用户
- `user_preferences` — 用户偏好
- `chat_records` — 对话记录
- `knowledge_docs` — 知识条目
- `feedbacks` — 用户反馈
- `digital_human_configs` — 数字人配置

首次启动自动建表，无需手动初始化。

## 常见问题

**Q: 对话报错 "402 Payment Required"**
A: DeepSeek API 余额不足，需充值。

**Q: 启动报 "DEEPSEEK_API_KEY 未设置"**
A: `cp .env.example .env`，填写有效的 API Key。

**Q: 知识库检索无结果**
A: 在管理后台点击"导入示例资料"，或运行 `python scripts/build_knowledge_base.py`。

**Q: 前端无法连接后端**
A: 确认后端运行在 `localhost:8000`，Vite 代理配置在 `vite.config.ts`。

**Q: 数字人页面黑屏**
A: 需要启动 OpenAvatarChat 服务（见上方"3D 数字人"章节），或直接使用 SVG 数字人（问答/导览页已内置）。

**Q: HTTPS 证书警告**
A: 项目使用 Vite 自签名证书（`@vitejs/plugin-basic-ssl`），用于启用麦克风权限，点"继续前往"即可。
