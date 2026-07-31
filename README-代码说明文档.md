# 灵山胜境 AI 数字人智能导游系统 — 代码说明文档

> 中国软件杯 2026 · A5 赛题 —— 基于多模态大模型的智慧景区导览系统
>
> 仓库：`https://github.com/LilyTLiu/scenic-digital-human-agent`

## 零、系统概览（30秒看懂）

```
游客打开浏览器（手机/电脑）→ 进入游客端
         ↓
  首页 → 云端伴游(数字人问答) / 游园地图(高德路线) / 胜境风物(景点+评价打卡) / 智能定制(AI生成路线)
         ↓
  问题发给后端 → 景区专有名词纠错 → ChromaDB 向量检索 → DeepSeek 大模型生成回答（流式）
         ↓
  回答返回前端 → 魔珐星云数字人口型同步播报 + 对话框 Xiaoxiao 语音播报 → 游客点赞/踩反馈
         ↓
  管理员后台 → 数据大屏 / 知识库 / 景区 / 数字人 / 评价 / 打卡 / 反馈报告
```

**三端协同**：
- 前端 React (Vite, HTTPS 端口 5173)
- 后端 FastAPI (端口 8000)
- 数字人 魔珐星云 Web SDK（前端动态加载、直连网关）

---

## 一、技术架构

### 1.1 架构总览

```
┌─────────────────────────────── 前端 (React + TS + Vite) ───────────────────────────────┐
│  游客端 Layout              管理端 /admin (Layout + 7个页面)                              │
│  ├ 首页 HomePage            ├ 数据大屏 Dashboard                                         │
│  ├ 云端伴游 ChatPage        ├ 知识库 KnowledgeBase                                       │
│  ├ 游园地图 TourPage        ├ 景区管理 ScenicSpots                                       │
│  ├ 胜境风物 SpotExplorePage ├ 数字人管理 DigitalHuman                                      │
│  ├ 智能定制 SmartPlanPage   ├ 游客评价 Reviews / 打卡 Checkins                            │
│  └ FAQ FAQPage              └ 反馈报告 ReportPage                                        │
│        │                            │                                                    │
│   axios /api/...（Vite 代理 → :8000）                                                      │
└───────────────┬──────────────────────────────────────────┬──────────────────────────────┘
                │                                          │
                ▼                                          ▼
┌─────────── 后端 (FastAPI + SQLite + ChromaDB) ────┐  ┌─ 魔珐星云数字人 ─────────┐
│ /api/chat   问答/流式问答（DeepSeek + RAG）        │  │ Web SDK 动态加载          │
│ /api/voice  ASR(faster-whisper) + TTS(edge-tts)   │  │ appId/appSecret 鉴权       │
│ /api/admin  管理后台全部接口                       │  │ speak() 口型同步播报       │
│ /api/user   手机号登录/偏好                        │  └───────────────────────────┘
│ /api/upload 文档上传→切片→向量化                   │
│ ChromaDB    text2vec-base-chinese 向量检索         │
│ SQLite      data.db（9 张表）                      │
└────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 模块 | 实现 |
|------|------|
| 前端框架 | React 18 + TypeScript + Vite 6（HTTPS 自签名证书） |
| UI 组件 | Ant Design 5 + Recharts（图表）+ 自定义国风样式 |
| 地图 | 高德地图 JS API（`@amap/amap-jsapi-loader`），步行路径规划 |
| 3D | Three.js（DigitalHuman3D） |
| 后端框架 | FastAPI + Uvicorn |
| 数据库 | SQLite（SQLAlchemy ORM，9 张表） |
| 向量库 | ChromaDB + `shibing624/text2vec-base-chinese` 嵌入模型 |
| 大模型 | DeepSeek（OpenAI 兼容 API，`deepseek-chat`），流式 SSE |
| 数字人 | 魔珐星云数字人 Web SDK（前端直连网关） |
| TTS | `edge-tts`，默认 `zh-CN-XiaoxiaoNeural` |
| ASR | `faster-whisper`，默认中文 `base` 模型 |
| 文本切片 | `langchain-text-splitters`（RecursiveCharacterTextSplitter） |

---

## 二、目录结构与代码分工

### 2.1 后端（Python/FastAPI，共 21 个文件，约 2490 行）

| 文件 | 行数 | 职责 |
|------|------|------|
| `backend/main.py` | 7 | 启动入口，运行 Uvicorn |
| `backend/app/app.py` | 31 | FastAPI 实例、CORS、注册 5 个路由模块 |
| `backend/app/config.py` | 36 | 配置中心，自动加载 `.env` |
| `backend/app/db/database.py` | 212 | 9 张表定义 + 建表迁移 + 种子数据 |
| `backend/app/core/rag.py` | 168 | ChromaDB 向量检索 + 导游提示词构建 |
| `backend/app/core/llm.py` | 99 | DeepSeek 调用（流式/非流式） |
| `backend/app/core/asr.py` | 103 | faster-whisper 中文识别 |
| `backend/app/core/tts.py` | 107 | edge-tts 语音合成 |
| `backend/app/core/query_normalization.py` | 61 | 景区专有名词纠错（ASR 后处理） |
| `backend/app/core/digital_human.py` | 30 | 口型数据模块（预留扩展） |
| `backend/app/api/chat.py` | 328 | 问答 `/api/chat/send`、流式 `/api/chat/stream` |
| `backend/app/api/voice.py` | 44 | `/api/voice/asr`、`/api/voice/tts` |
| `backend/app/api/admin.py` | 950 | 管理后台全套 API（约 30 个端点） |
| `backend/app/api/upload.py` | 165 | 文档上传 → 解析 → 切片 → 向量化 |
| `backend/app/api/user.py` | 131 | 手机号验证码登录 + 偏好管理 |
| `backend/app/api/weather.py` | 21 | 高德天气代理（当前前端使用 Open-Meteo，此模块未挂载） |

**脚本**（`backend/scripts/`）：

| 文件 | 职责 |
|------|------|
| `build_knowledge_base.py` | 从 `示范景区公开资料包` 构建 Chroma 知识库 |
| `rebuild_demo_knowledge.py` | 重建演示知识库（完整流程） |
| `sync_knowledge_chroma.py` | SQLite 知识条目 ↔ ChromaDB 增量同步 |
| `build_tourist_db.py` | 导入游客行为数据（14 万条） |
| `test_full_pipeline.py` | 全链路冒烟测试 |

### 2.2 前端（React/TypeScript，约 9500 行）

**路由注册**（[frontend/src/App.tsx](frontend/src/App.tsx)）：

```text
/                  → 重定向到 /tourist
/tourist           游客端（TouristLayout 外壳）
  ├ index          首页 HomePage
  ├ chat           云端伴游 ChatPage（数字人问答）
  ├ tour           游园地图 TourPage
  ├ recommend      胜境风物 SpotExplorePage
  ├ plan           智能定制 SmartPlanPage
  └ faq            使用指南 FAQPage
/admin             管理端（AdminLayout 外壳）
  ├ index          数据大屏 Dashboard
  ├ knowledge      知识库管理
  ├ scenic-spots   景区管理
  ├ digital-human  数字人管理
  ├ reviews        游客评价管理
  ├ checkins       游客打卡管理
  └ reports        反馈报告
```

**游客端页面**：

| 文件 | 行数 | 职责 |
|------|------|------|
| `pages/tourist/HomePage.tsx` | 384 | 首页：大图实景轮播 + 悬浮信息卡片 + 开放时间/门票/活动滚动条 + 服务入口五卡片 |
| `pages/tourist/ChatPage.tsx` | 956 | 云端伴游：3 个魔珐星云数字人切换 + 流式问答 + 快捷提问 + 语音输入 |
| `pages/tourist/TourPage.tsx` | 562 | 游园地图：高德步行路径规划 + 路线卡片 + 景点讲解（Edge TTS） |
| `pages/tourist/SpotExplorePage.tsx` | 1482 | 胜境风物：景点探索 + 游客评价 + 打卡墙（含数据同步） |
| `pages/tourist/SmartPlanPage.tsx` | 289 | 智能定制：偏好标签表单 → 生成专属路线（写入 sessionStorage） |
| `pages/tourist/FAQPage.tsx` | 203 | 使用指南 + 数字人角色介绍 |
| `pages/tourist/Layout.tsx` | 141 | 游客端外壳：mobile 底部导航 / desktop 侧边导航 |
| `pages/tourist/DigitalHumanPage.tsx` / `RealHumanPage.tsx` / `RecommendPage.tsx` | 186/162/222 | 早期版本页面（`real` 已重定向到 chat，保留兼容） |

**管理端页面**：

| 文件 | 行数 | 职责 |
|------|------|------|
| `pages/admin/Layout.tsx` | 119 | 管理端侧边栏外壳 |
| `pages/admin/Dashboard.tsx` | 479 | 数据大屏：总量统计 + 7 天/今日趋势图 + 各景点对话量 + 游客列表 |
| `pages/admin/KnowledgeBase.tsx` | 566 | 知识库 CRUD + 分页搜索 + 文档上传导入 |
| `pages/admin/ScenicSpots.tsx` | 289 | 景区管理 CRUD |
| `pages/admin/DigitalHuman.tsx` | 184 | 数字人配置管理 |
| `pages/admin/Reviews.tsx` | 285 | 游客评价管理（软删除） |
| `pages/admin/Checkins.tsx` | 279 | 游客打卡管理（软删除） |
| `pages/admin/ReportPage.tsx` | 211 | 反馈报告 + 对话记录查询 |

**核心组件 / Hooks / 配置**：

| 文件 | 行数 | 职责 |
|------|------|------|
| `components/ScenicMap.tsx` | 363 | 高德地图封装：标记、步行路径、路线绘制 |
| `components/DigitalHuman.tsx` / `DigitalHuman3D.tsx` | 300/291 | 早期 2D/3D 数字人渲染（Canvas/Three.js） |
| `components/LoginModal.tsx` / `ProfileDrawer.tsx` | 234/239 | 手机号登录弹窗 / 个人偏好抽屉 |
| `hooks/useXmovAvatar.ts` | 233 | 魔珐星云 SDK 加载、连接、播报、停止、销毁 |
| `hooks/useMediaQuery.ts` | 33 | 响应式断点判断（mobile/desktop） |
| `hooks/useDigitalHuman.ts` | 163 | 早期数字人口型驱动 hook |
| `config/xmovAvatars.ts` | 37 | 3 个魔珐星云数字人档案（小文/小云/小灵），从 `.env` 读 App ID/Secret |
| `config/personas.ts` | 146 | 4 个本地 AI 导游人设（小灵/小山/妙音/小禅）：声音/性格/视觉/3D |
| `config/amap.ts` | 44 | 高德地图 Key + 景点坐标 |
| `services/api.ts` | 141 | 全部后端 API 封装（axios + SSE 流式读取） |
| `utils/asr.ts` | 63 | 前端录音（MediaRecorder）+ 景区词纠错 |
| `utils/voice.ts` | 123 | 浏览器 TTS 语音选择与降级 |
| `contexts/UserContext.tsx` | 108 | 全局用户状态（token 持久化到 localStorage） |

---

## 三、数据模型（SQLite · 9 张表）

文件：`backend/app/db/database.py`（数据库文件 `backend/data.db`）

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `chat_records` | 对话记录 | session_id, user_id, scenic_spot, user_input, ai_reply, created_at |
| `knowledge_docs` | 知识文档 | title, content, category, scenic_spot, chroma_ids(JSON) |
| `digital_human_configs` | 数字人配置 | name, scenic_spot, avatar, voice, model_config(JSON) |
| `users` | 用户 | phone(唯一), nickname, token, created_at |
| `user_preferences` | 用户偏好 | user_id, interests(JSON), travel_style, group_type |
| `feedbacks` | 满意度反馈 | rating(1/-1), question, created_at |
| `scenic_spots` | 景区配置 | name(唯一), slug(唯一，ChromaDB 集合名), enabled |
| `visitor_reviews` | 游客评价 | spot_id, author, avatar, rating(1-5), text, deleted(软删除) |
| `visitor_checkins` | 游客打卡 | spot_id, author, image, caption, deleted(软删除) |

**兼容性迁移**：`init_db()` 使用 `ALTER TABLE ... ADD COLUMN` 的 try/except 模式，为旧表增量添加新列（如 `chat_records.user_id`、`knowledge_docs.chroma_ids`），零停机兼容旧库。

**种子数据**：首次启动自动创建"灵山胜境"景区，并预置 10 条游客评价 + 6 条打卡数据。

---

## 四、后端 API 接口清单

统一前缀 `/api`，注册于 `backend/app/app.py`。

### 4.1 对话 `/api/chat`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/chat/send` | 单轮问答（返回 reply + references） |
| POST | `/chat/stream` | 流式问答（SSE，逐 token 返回） |

### 4.2 语音 `/api/voice`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/voice/asr` | 上传音频 → faster-whisper 识别为中文 |
| POST | `/voice/tts` | 文本 → edge-tts 合成 MP3（支持 voice/style/rate/pitch） |

### 4.3 管理后台 `/api/admin`（约 30 个端点）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/dashboard` | 数据大屏：总量、7 天趋势、今日时段、各景点对话量+知识覆盖 |
| GET/POST/PUT/DELETE | `/admin/knowledge[/{id}]` | 知识库 CRUD + 分页搜索 |
| GET | `/admin/knowledge-categories` | 知识分类列表 |
| GET | `/admin/chat-records` / `/admin/chat-sessions` | 对话记录 / 会话查询 |
| GET/PUT | `/admin/digital-humans[/{id}]` | 数字人配置管理 |
| POST | `/admin/switch-persona` | 切换数字人形象 |
| GET/POST/PUT/DELETE | `/admin/scenic-spots[/{id}]` | 景区管理（自动同步 ChromaDB 集合） |
| GET | `/admin/tourist/insights` / `/admin/tourist/recommend` | 游客行为洞察 / 个性化推荐 |
| POST | `/admin/import-demo` | 一键导入示例知识库 |
| POST | `/admin/feedback` | 游客点赞/踩反馈 |
| GET | `/admin/feedback/stats` | 满意度统计 |
| GET/POST/DELETE | `/admin/reviews[/{id}]` | 游客评价管理（软删除） |
| GET | `/admin/reviews/stats` | 评价统计 |
| GET/POST/DELETE | `/admin/checkins[/{id}]` | 游客打卡管理（软删除） |

### 4.4 用户 `/api/user`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/user/send-code` | 发送验证码（打印到后端控制台） |
| GET | `/user/codes` | 查看当前验证码（开发调试用） |
| POST | `/user/login` | 手机号 + 验证码登录，返回 token |
| GET/PUT | `/user/profile` | 获取 / 更新用户资料与偏好 |

### 4.5 上传 `/api/upload`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/upload/document` | 上传 docx/xlsx/txt → 切片 → 向量化入库（限 50MB） |

---

## 五、核心业务流程

### 5.1 游客提问 → AI 回答（主链路，流式）

```
[游客文字/语音输入] → ChatPage sendMessage()
       ↓ POST /api/chat/stream {message, scenic_spot, session_id, persona_*}
backend chat.py
       ① query_normalization 景区专有名词纠错（"灵山警区"→"灵山景区"）
       ② rag.search() ChromaDB 向量相似度 → top-5 知识片段
       ③ rag.build_prompt() 导游系统指令 + 知识片段 + 最近 10 轮历史
       ④ llm.stream() DeepSeek 流式生成
       ⑤ 写入 chat_records 表（关联 user_id / scenic_spot）
       ↓ SSE 逐 token 返回
前端打字机展示 → 魔珐星云数字人 speak() 播报（口型同步）
```

关键代码：
- 流式对话：`backend/app/api/chat.py` `stream()` 端点
- RAG 检索：`backend/app/core/rag.py` `search()`
- 提示词：`backend/app/core/rag.py` `build_prompt()`

### 5.2 语音链路

**ASR（语音 → 文字）**：
```
前端 MediaRecorder 录音（自动选 WAV/WebM/ogg）
       ↓ POST /api/voice/asr
faster-whisper 识别（language=zh，base 模型）
       ↓ ASR_HOTWORDS + ASR_INITIAL_PROMPT 增强景区词
query_normalization 纠错 → 进入问答链路
```

**TTS（文字 → 语音）**：
```
前端对话框"播报"按钮 → POST /api/voice/tts {voice: zh-CN-XiaoxiaoNeural}
edge-tts 合成 MP3 → Audio 播放
5 秒超时自动降级到浏览器 SpeechSynthesis
```

### 5.3 魔珐星云数字人链路

```
ChatPage 加载 → useXmovAvatar()
   ├ 从 frontend/.env 读取 VITE_XMOV_APP_ID / APP_SECRET
   ├ 动态加载 XmovAvatar Web SDK（@latest）
   ├ 用户点击"连接" → new XmovAvatar(...) → init()（含模型下载进度）
   └ 问答完成后 xmov.speak(回答) → 数字人口型同步播报
   ├ 停止播报 → interactiveidle()
   └ 结束会话 → destroy('user')（避免持续计费）
```

- 3 个数字人：**导游小文 / 导游小云 / 导游小灵**（`config/xmovAvatars.ts`）
- 每个数字人有独立 App ID/App Secret、standby 形象图，切换人像即切换会话
- 会话状态机：`idle → loading-sdk → initializing → live → speaking → error`

### 5.4 用户登录与个性化

```
手机号 → send-code（验证码打印后端控制台）→ login → 生成 UUID token
        → localStorage 持久化 → UserContext 全局共享
        → 提问携带 token → chat_records 记录 user_id
        → 首页按 UserPreference（interests/travel_style/group_type）推荐快捷提问
```

### 5.5 智能定制路线

```
SmartPlanPage 标签表单（游览时长/主题/节奏/人群 + 自由输入）
       ↓ generateRoute() 规则匹配 + 随机种子生成 A/B/C 变体
       ↓ 写入 sessionStorage.customRoutes
       ↓ navigate('/tourist/tour?custom=0') → TourPage 自动展开第一站
       ↓ ScenicMap 高德 AMap.Walking 逐段规划真实步行路径（失败降级直线）
```

### 5.6 知识库管理

```
管理员上传 docx / 手动新增 / 一键导入示例
       ↓ upload.py 解析 → langchain 切片（chunk_size=500）
       ↓ text2vec-base-chinese 向量化 → ChromaDB upsert
       ↓ 同步 SQLite knowledge_docs（chroma_ids 记录片段 ID）
RAG 检索即可搜到新知识
```

**chunk ID 唯一性**：`add_documents()` 的片段 ID 采用 `chunk_{uuid}_{i}` 前缀，避免重复添加覆盖旧数据。

---

## 六、数字人系统

系统有两套数字人体系：

### 6.1 魔珐星云数字人（当前主链路，3 人像）

| 人像 | 配置键 | 环境变量 |
|------|--------|---------|
| 导游小文 | `default` | `VITE_XMOV_APP_ID` / `VITE_XMOV_APP_SECRET` |
| 导游小云 | `guide-yun` | `VITE_XMOV_AVATAR_2_ID` / `VITE_XMOV_AVATAR_2_SECRET` |
| 导游小灵 | `guide-ling` | `VITE_XMOV_AVATAR_3_ID` / `VITE_XMOV_AVATAR_3_SECRET` |

App ID/App Secret 由魔珐星云数字人平台提供，配置在 `frontend/.env`（已被 gitignore，不会提交）。**注意：这些密钥只在本机 `.env` 中生效，队友环境需要各自配置。**

### 6.2 本地 AI 导游人设（4 角色，用于对话风格与降级渲染）

`config/personas.ts` 定义 4 个导游，每个含独立 Edge TTS 声线、性格、颜色、Canvas 视觉特征、3D GLB：

| 导游 | 角色 | 声线(Edge TTS) | 3D 形象 |
|------|------|---------------|---------|
| 小灵 | 灵山专属导游 · 热情专业 | zh-CN-XiaoxiaoNeural | brunette.glb |
| 小山 | 佛学文化顾问 · 沉稳博学 | zh-CN-YunxiNeural | avaturn.glb |
| 妙音 | 艺术鉴赏向导 · 优雅灵动 | zh-CN-XiaoyiNeural | brunette-t.glb |
| 小禅 | 禅修体验向导 · 禅意智慧 | zh-CN-YunyeNeural | avatarsdk.glb |

---

## 七、环境配置与快速启动

### 7.1 后端配置

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate   Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env        # 或 cp .env.example .env
```

编辑 `backend/.env`，**至少配置 DeepSeek API Key**：

```env
DEEPSEEK_API_KEY=你的_DeepSeek_API_Key
DEEPSEEK_API_BASE=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

WHISPER_MODEL=base           # 准确率优先可改 small / medium
TTS_VOICE=zh-CN-XiaoxiaoNeural
```

启动后端：

```bash
python main.py
```

- API: `http://localhost:8000`
- 文档: `http://localhost:8000/docs`

### 7.2 前端配置

```bash
cd frontend
npm install
copy .env.example .env.local   # 或 cp .env.example .env.local
```

编辑 `frontend/.env.local`（魔珐星云三个数字人 + 高德地图）：

```env
# 导游小文
VITE_XMOV_APP_ID=你的魔珐星云_App_ID
VITE_XMOV_APP_SECRET=你的魔珐星云_App_Secret
# 导游小云
VITE_XMOV_AVATAR_2_ID=
VITE_XMOV_AVATAR_2_SECRET=
# 导游小灵
VITE_XMOV_AVATAR_3_ID=
VITE_XMOV_AVATAR_3_SECRET=
VITE_XMOV_GATEWAY_SERVER=https://nebula-agent.xingyun3d.com/user/v1/ttsa/session
VITE_XMOV_SDK_URL=https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar@latest.js

# 高德地图
VITE_AMAP_KEY=
VITE_AMAP_SECRET=
```

启动前端：

```bash
npm run dev
```

- 访问 `https://localhost:5173`（Vite 自签名 HTTPS，麦克风权限需要；浏览器提示证书风险时选择继续访问）

**注意**：修改 `.env` 后需重启 dev server 才生效。

### 7.3 知识库构建

首次使用需先构建知识库，否则 AI 无知识可检索：

```bash
cd backend
python scripts/build_knowledge_base.py    # 从示范资料包构建
# 或在管理后台「知识库」页点击「导入示例资料」（POST /api/admin/import-demo）
```

首次运行会下载嵌入模型 `shibing624/text2vec-base-chinese` 与 Whisper 模型，需联网。

### 7.4 桌面端 / 移动端

游客端同一套功能逻辑、两套布局模式（`useMediaQuery` 判断）：

- **移动端**（<900px）：底部 Tab 导航，`max-width: 480px` 外壳
- **桌面端**（≥900px）：左侧侧边导航，宽屏双栏布局
- 桌面样式统一挂在 `.app-shell--desktop` 命名空间下（`frontend/src/index.css`）

---

## 八、常用命令

| 操作 | 命令 |
|------|------|
| 启动后端 | `cd backend && python main.py` |
| 启动前端 | `cd frontend && npm run dev` |
| 前端生产构建 | `cd frontend && npm run build` |
| 后端语法检查 | `cd backend && python -m compileall app` |
| 重建知识库 | `cd backend && python scripts/build_knowledge_base.py` |
| 增量同步 Chroma | `cd backend && python scripts/sync_knowledge_chroma.py` |
| 全链路测试 | `cd backend && python scripts/test_full_pipeline.py` |

---

## 九、常见问题排查

| 现象 | 排查 |
|------|------|
| 后端 8000 端口占用 | `Get-NetTCPConnection -LocalPort 8000` 找到进程并结束 |
| 问答服务不可用 | 检查 `backend/.env` 的 `DEEPSEEK_API_KEY`、账户余额、后端是否运行 |
| 数字人无法连接 | 检查 `frontend/.env.local` 的 App ID/Secret、魔珐星云应用可用性、浏览器控制台报错；点击"结束"主动销毁会话 |
| 语音识别失败 | 检查是否通过 `https://localhost:5173` 访问、麦克风权限、Whisper 模型是否已下载 |
| 识别不准确 | `.env` 提升 `WHISPER_MODEL=small/medium`，或用 `ASR_HOTWORDS` 扩展景区热词 |
| 对话框无声音 | 检查 `TTS_PROVIDER=edge`、浏览器自动播放权限 |
| `.env` 修改未生效 | 重启 dev server / 后端 |

---

## 十、安全与注意事项

1. **不要提交密钥**：`backend/.env`、`frontend/.env`（.gitignore 已排除）、`frontend/.env.local` 均不入库。
2. 不要在 README、截图、日志中公开 DeepSeek API Key、魔珐星云 App ID/App Secret。
3. 魔珐星云 App ID/Secret 进入前端构建产物，适合本地开发与比赛演示；生产环境建议改用平台支持的服务端签名/临时凭证。
4. 当前数字人密钥仅在你本地 `.env` 生效，**团队协作时需各自配置**。
5. 数据库文件 `backend/data.db` 自动生成，含种子数据，无需手动初始化。

---

*文档最后更新：2026-07-31 · 与 `main` 分支最新代码同步*
