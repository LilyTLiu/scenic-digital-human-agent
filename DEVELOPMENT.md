# 开发指南 — AI数字人智能导游系统

## 项目简介

"中国软件杯"2026年赛题A5——AI数字人智能旅游导游系统。基于 RAG + LLM 的智能导游，支持语音问答、数字人播报、景区导览等功能。

**技术栈：**
- 后端：Python FastAPI + ChromaDB + DeepSeek API + edge-tts + faster-whisper
- 前端：React 18 + TypeScript + Vite + SVG数字人
- 知识库：sentence-transformers向量化 + ChromaDB检索 + DeepSeek生成

## 环境要求

| 工具 | 版本 |
|------|------|
| Python | >= 3.10 |
| Node.js | >= 18 |
| npm | >= 9 |
| Git | 任意 |

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/LilyTLiu/scenic-digital-human-agent.git
cd scenic-digital-human-agent
```

### 2. 配置后端

```bash
cd backend

# 创建虚拟环境（可选但推荐）
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置 API Key
# 复制 .env.example 为 .env，填写你的 DeepSeek API Key
# Windows:
copy .env.example .env
# Mac/Linux:
cp .env.example .env

# 首次运行或数据更新后，需重建知识库向量：
# python scripts/build_knowledge_base.py
# （chroma_db/ 已预置构建好的知识库，通常无需重建）
```

### 3. 启动后端

```bash
python main.py
# 后端运行在 http://localhost:8000
# API文档：http://localhost:8000/docs
```

### 4. 配置前端

```bash
cd ../frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 前端运行在 http://localhost:5173
```

### 5. 访问应用

浏览器打开 `http://localhost:5173`，即可使用。

## 项目结构

```
scenic-digital-human-agent/
├── backend/                    # Python后端
│   ├── main.py                 # 启动入口
│   ├── requirements.txt        # Python依赖
│   ├── .env.example            # API Key配置模板
│   ├── app/
│   │   ├── api/                # API路由
│   │   │   ├── chat.py         # 对话接口
│   │   │   └── voice.py        # TTS/ASR接口
│   │   ├── core/               # 核心模块
│   │   │   ├── llm.py          # DeepSeek API调用
│   │   │   ├── rag.py          # RAG检索增强
│   │   │   ├── tts.py          # 文本转语音
│   │   │   └── asr.py          # 语音识别
│   │   └── config.py           # 配置管理
│   ├── chroma_db/              # 知识库向量数据库（预置）
│   └── scripts/
│       └── build_knowledge_base.py  # 重建知识库
├── frontend/                   # React前端
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── components/         # 组件（DigitalHuman等）
│       ├── pages/tourist/      # 游客端页面
│       ├── config/             # 配置（人物设定等）
│       ├── services/           # API调用
│       └── utils/              # 工具函数
├── 示范景区公开资料包/         # 竞赛提供的原始资料
├── CLAUDE.md                   # Claude Code配置
└── DEVELOPMENT.md              # 本文件
```

## 开发说明

### 知识库

知识库基于 `示范景区公开资料包/` 中的 .docx 文件构建，使用 sentence-transformers 生成768维向量，存储在 ChromaDB 中。

**重建知识库：**
```bash
cd backend
python scripts/build_knowledge_base.py
```

首次运行时需下载 sentence-transformers 模型（约400MB），设置 `HF_HUB_OFFLINE=0`：
```bash
$env:HF_HUB_OFFLINE="0"  # PowerShell
python scripts/build_knowledge_base.py
```
之后设置 `HF_HUB_OFFLINE=1` 使用离线模式。

### API Key

- 获取 DeepSeek API Key：https://platform.deepseek.com/api_keys
- 将 key 填入 `backend/.env` 文件的 `DEEPSEEK_API_KEY=` 后面
- `.env` 已在 `.gitignore` 中，不会被提交

### 前端开发

- 开发服务器默认代理 `/api` 到 `http://localhost:8000`
- 数字人使用 SVG 矢量渲染，通过 CSS 动画驱动
- 人物配置在 `src/config/personas.ts`

## 常见问题

**Q: 启动后端报 "DEEPSEEK_API_KEY 未设置"**
A: 复制 `.env.example` 为 `.env`，填写有效的 API Key。

**Q: 问答返回500错误**
A: 确认后端已启动（`python main.py`），API Key 有效，网络可访问 DeepSeek API。

**Q: 前端无法连接后端**
A: 确认后端运行在 `localhost:8000`，Vite 代理配置正确（`vite.config.ts`）。

**Q: 知识库检索无结果**
A: 运行 `python scripts/build_knowledge_base.py` 重建知识库。
