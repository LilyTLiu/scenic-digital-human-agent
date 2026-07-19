# 灵山胜境 AI 数字人智能导游系统 — 代码说明文档

## 零、系统概览（30秒看懂）

```
游客打开浏览器 → 看到3D数字人导游 → 打字或语音提问
         ↓
    问题发给后端 → 向量库检索相关知识 → DeepSeek大模型生成回答
         ↓
    回答返回前端 → 数字人口型同步播报 → 游客可以点赞/踩反馈
         ↓
    管理员后台 → 增删改知识库 → 查看数据大屏 → 分析满意度趋势
```

**三端协同**：React前端(5173端口) + FastAPI后端(8000端口) + OpenAvatarChat数字人引擎(8787端口)

---

## 一、代码文件清单与分工

### 后端 (Python/FastAPI) — 共13个核心文件

| 文件 | 行数 | 一句话职责 | 对应赛题要求 |
|------|------|-----------|-------------|
| `backend/main.py` | 5 | 启动入口，挂载uvicorn | — |
| `backend/app/app.py` | 28 | 注册路由、CORS中间件 | — |
| **`backend/app/db/database.py`** | 102 | 6张数据表定义(SQLite) | 数据库设计 |
| **`backend/app/core/rag.py`** | 98 | 向量检索核心(ChromaDB) | RAG知识库 |
| **`backend/app/core/llm.py`** | 126 | DeepSeek大模型调用 | 智能问答 |
| `backend/app/core/tts.py` | — | 文本转语音(Edge TTS) | 语音交互 |
| `backend/app/core/asr.py` | — | 语音识别(Whisper) | 语音交互 |
| **`backend/app/api/chat.py`** | 190 | 核心对话API + OpenAI兼容端点 | 智能问答 |
| **`backend/app/api/admin.py`** | 438 | 管理后台全部API | 管理后台 |
| **`backend/app/api/user.py`** | 125 | 手机号登录+偏好管理 | 用户系统 |
| `backend/app/api/upload.py` | 71 | 文档上传→解析→向量化 | 知识库管理 |
| `backend/app/api/voice.py` | — | TTS/ASR接口 | 语音交互 |
| `backend/app/config.py` | — | 配置文件 | — |

### 前端 (React/TypeScript) — 共16个核心文件

| 文件 | 行数 | 一句话职责 | 对应赛题要求 |
|------|------|-----------|-------------|
| `frontend/vite.config.ts` | 37 | HTTPS + 代理转发 + 局域网访问 | 部署访问 |
| **`frontend/src/App.tsx`** | 38 | 路由注册(游客端+管理端) | 页面导航 |
| `frontend/src/services/api.ts` | 96 | 全部API请求封装(axios) | 前后端通信 |
| **`frontend/src/contexts/UserContext.tsx`** | 108 | 全局用户状态(token持久化) | 用户系统 |
| `frontend/src/config/personas.ts` | 117 | 4个AI导游角色定义 | 数字人配置 |
| **`frontend/src/pages/tourist/HomePage.tsx`** | 312 | 游客首页(角色展示+个性化推荐) | 智能推荐 |
| **`frontend/src/pages/tourist/ChatPage.tsx`** | 545 | AI对话核心页(最复杂) | 智能问答 |
| `frontend/src/pages/tourist/DigitalHumanPage.tsx` | 260 | 3D数字人全屏交互页 | 数字人展示 |
| `frontend/src/pages/tourist/FAQPage.tsx` | — | 使用指南+角色介绍 | 使用帮助 |
| `frontend/src/pages/tourist/RecommendPage.tsx` | — | 智能路线推荐(偏好匹配) | 智能推荐 |
| `frontend/src/pages/tourist/TourPage.tsx` | — | 导览地图页 | 智能导览 |
| **`frontend/src/pages/admin/Dashboard.tsx`** | 174 | 数据大屏(统计+游客列表) | 管理后台 |
| **`frontend/src/pages/admin/KnowledgeBase.tsx`** | 198 | 知识库CRUD+导入 | 管理后台 |
| `frontend/src/pages/admin/ReportPage.tsx` | 128 | 满意度反馈报告 | 管理后台 |
| `frontend/src/pages/admin/DigitalHuman.tsx` | — | 数字人形象管理 | 管理后台 |
| `frontend/src/components/LoginModal.tsx` | — | 手机号验证码登录弹窗 | 用户系统 |
| `frontend/src/components/ProfileDrawer.tsx` | — | 个人偏好设置抽屉 | 用户系统 |

### 数字人配置

| 文件 | 说明 |
|------|------|
| `OAC-config/lingshan_http.yaml` | OpenAvatarChat 完整配置(模型/ASR/TTS/LLM) |

---

## 二、核心技术路径（数据如何流动）

### 2.1 游客提问 → AI回答（核心链路）

```
[游客输入文字/语音]
       ↓
ChatPage.tsx (第136行 sendMessage函数)
       ↓  POST /api/chat/send  {message, token}
backend/app/api/chat.py (第37行 send_message)
       ↓
  ① RAG检索: rag.py search() → ChromaDB向量相似度匹配 → top-5相关片段
  ② 拼装提示词: rag.py build_prompt() → 导游系统指令 + 知识片段 + 用户问题
  ③ 调用大模型: llm.py chat() → DeepSeek API
  ④ 记录对话: database.py ChatRecord → SQLite (含user_id关联游客)
       ↓
返回 {reply, references} → ChatPage.tsx展示
       ↓
游客点👍/👎 → POST /api/admin/feedback → 存入Feedback表
```

**关键代码位置**：
- RAG检索: `backend/app/core/rag.py` 第62行 `search()`
- 提示词构建: `backend/app/core/rag.py` 第75行 `build_prompt()`
- 对话记录: `backend/app/api/chat.py` 第51行

### 2.2 用户登录 → 个性化推荐

```
[输入手机号] → LoginModal → POST /api/user/send-code
                                    ↓
                          后端生成4位验证码，打印到控制台
                                    ↓
[输入验证码] → POST /api/user/login → 验证通过 → 生成UUID token
                                    ↓
                          创建User记录，返回token
                                    ↓
前端存localStorage → UserContext全局共享 → token随身携带
                                    ↓
游客问问题时带上token → 后端解析user_id写入ChatRecord
                                    ↓
管理员看数据大屏 → 服务游客数 = 去重user_id统计
                                    ↓
首页根据用户偏好(interests/travel_style)推荐个性化问题
```

**关键代码位置**：
- 登录: `backend/app/api/user.py`
- 用户状态: `frontend/src/contexts/UserContext.tsx`
- 偏好匹配: `frontend/src/pages/tourist/HomePage.tsx` preferenceQuestions映射

### 2.3 知识库管理（管理员操作）

```
[管理员上传docx/手动新增] → 后端解析
                              ↓
                   ① 文本切片: RecursiveCharacterTextSplitter (chunk_size=500)
                   ② 向量化: sentence-transformers (text2vec-base-chinese)
                   ③ 存入ChromaDB (114个向量片段)
                   ④ 同步SQLite (40条知识条目)
                              ↓
                   RAG检索可立即搜到新知识
```

**关键代码位置**：
- 文档解析: `backend/app/api/upload.py`
- 向量化入库: `backend/app/core/rag.py` 第44行 `add_documents()`
- 一键导入: `backend/app/api/admin.py` 第103行 `import_demo_data()`

### 2.4 3D数字人集成

```
React页面 iframe嵌入 → OpenAvatarChat WebUI
        ↓                      ↓
   角色切换请求     →   替换current.zip (LAM模型包)
   /api/admin/switch-persona  → OAC自动重载新形象
        ↓
   语音输入 → OAC SenseVoice ASR → 文字
   文字 → OAC调用后端 /api/chat/v1 → AI回答
   回答 → OAC EdgeTTS → 语音 + 口型同步(LAM驱动)
```

**关键配置**：`lingshan_http.yaml` 中 LLM 的 `api_url` 指向后端 `/api/chat/v1`

---

## 三、技术难点与解决方案

### 难点1：ChromaDB增量添加导致旧数据被覆盖

**问题**：`rag.py` 中 `add_documents()` 的 chunk ID 从 `chunk_0` 开始递增，每次添加新文档时 ID 与旧文档重复，ChromaDB 的 `upsert` 机制会覆盖旧数据。

**解决**：在 chunk ID 中加入 UUID 前缀 `chunk_{uuid}_{i}`，确保每次添加的 ID 全局唯一。

### 难点2：局域网访问时数字人无法获取麦克风

**问题**：浏览器安全策略规定 `getUserMedia()` 只允许 localhost 或 HTTPS 环境调用。局域网 `http://10.x.x.x:5173` 既不是 localhost 也不是 HTTPS，导致数字人语音交互完全失效。

**解决**：Vite 开发服务器启用 HTTPS（`@vitejs/plugin-basic-ssl` 自签名证书），页面自动检测协议——HTTPS 时通过 Vite 代理转发到 OAC，HTTP 时直连 OAC，保证本地开发和远程访问都正常工作。

### 难点3：SQLite 表中新增字段的兼容性

**问题**：`ChatRecord` 表后期需要新增 `user_id` 字段关联用户系统，但 SQLAlchemy 的 `create_all()` 不会为已存在的表添加新列。

**解决**：在 `init_db()` 中用 `ALTER TABLE ADD COLUMN` 的 try/except 模式，列已存在则忽略，不存在则添加，实现零停机兼容。

### 难点4：管理后台查询效率

**问题**：数据大屏需要展示今日/本周/7日趋势/热门问题等多项统计，最初用 for 循环逐日查询（10+ 次 DB 请求）。

**解决**：改用 SQL 聚合查询 `GROUP BY date` + `func.case()` 条件计数，将 10+ 次查询压缩到 4 次。

---

## 四、创新点

### 4.1 RAG + 结构化知识库的深度融合

不是简单的全文搜索 → 丢给 LLM。而是：
- 知识以「景点名称+位置+外观+文化内涵+游玩攻略+开放信息」结构存储
- 提示词工程：引导 LLM 优先从「演艺/开放信息」「游玩亮点」字段提取实用信息
- 回答约束：50-80字短回答，模拟真实导游口语风格

### 4.2 完整的用户数据闭环

```
用户登录(手机号) → 聊天交互(记录user_id) → 评分反馈(👍/👎)
                                            ↓
                              数据大屏(独立游客数+满意度趋势)
                                            ↓
                              优化知识库(补充差评涉及的知识点)
```

### 4.3 前后端均无缝兼容 HTTPS 局域网部署

Vite 代理层统一处理 HTTPS → HTTP 的协议转换，前端通过 `window.location.protocol` 自动判断连接方式，不侵入任何业务代码。

### 4.4 四位一体的人设系统

不是简单换皮肤——每个人设有独立的声音(EdgeTTS voice)、性格描述(影响LLM回答风格)、外观(ZIP模型包)、颜色主题，选人即选全套体验。

---

## 五、快速启动（新同学只需3步）

```powershell
# 1. 后端 (需先设置DeepSeek API Key)
$env:DEEPSEEK_API_KEY="sk-你的Key"
cd backend
D:\Miniconda3\envs\avatar\python.exe main.py

# 2. 前端
cd frontend
npm install
npm run dev

# 3. 数字人 (双击即可)
D:\contest\start-oac.bat
```

然后访问 `https://localhost:5173`（本地）或 `https://你的IP:5173`（局域网）。

**注意**：首次使用需在管理后台点击「导入示例资料」加载知识库，否则 AI 没有知识可检索。
