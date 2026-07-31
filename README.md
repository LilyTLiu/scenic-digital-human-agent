# 灵山景区导览数字人系统

面向无锡灵山胜境的景区导览数字人系统。当前游客端合并为四个主界面：首页、云端伴游、游园地图、胜境风物。其中“云端伴游”为 AI 导游核心界面，使用魔珐星云数字人 SDK 驱动数字人形象，DeepSeek + RAG 生成讲解答案，faster-whisper 完成中文语音转文字，Microsoft Edge TTS 的 `zh-CN-XiaoxiaoNeural` 完成对话框语音播报。

本仓库不提交 DeepSeek API Key、魔珐星云 App ID/App Secret、真实本地 `.env` 文件。部署者需要按本文档自行配置。

## 当前功能

- 游客端四界面：首页、云端伴游、游园地图、胜境风物。
- 云端伴游桌面端为对话框 + 数字人同屏布局，手机端保留数字人/对话框切换布局；问题和答案记录同步展示。
- 支持文字输入、浏览器录音、后端中文 ASR、流式问答、对话框 Xiaoxiao 语音播报。
- 数字人形象通过魔珐星云前端 SDK 接入，当前支持三位导游形象切换；连接、结束、播报停止由前端控制。
- RAG 知识库基于公开资料包中的两个 Word 文档重建，覆盖灵山胜境与拈花湾禅意小镇条目，回答会按提示词约束为简洁中文导游讲解。
- 游园地图支持高德地图点位、路线绘制和后端 TTS 景点播报。
- 首页、游园地图、胜境风物包含天气展示；胜境风物包含景点浏览、评价、打卡和 TTS 播报。
- 游客端布局分离：手机端保留移动布局和底部导航，电脑端启用侧边导航和宽屏布局。
- 管理后台保留知识库、景区、数字人配置、反馈数据等功能。

## 技术栈

| 模块 | 实现 |
| --- | --- |
| 前端 | React 18 + TypeScript + Vite |
| 游客端布局 | 同一功能组件 + `mobile/desktop` 布局模式 |
| 数字人 | 魔珐星云数字人 Web SDK |
| 对话 | DeepSeek OpenAI-compatible API |
| 知识库 | ChromaDB + `shibing624/text2vec-base-chinese` |
| TTS | `edge-tts`，默认 `zh-CN-XiaoxiaoNeural` |
| ASR | `faster-whisper`，默认中文 `base` 模型 |
| 后端 | FastAPI + Uvicorn + SQLite |

## 目录说明

```text
backend/
  app/api/chat.py              # 问答与流式问答接口
  app/api/voice.py             # ASR/TTS 接口
  app/core/asr.py              # faster-whisper 中文识别
  app/core/tts.py              # edge/xiaoxiao TTS 链路
  app/core/llm.py              # DeepSeek 调用
  app/core/rag.py              # 知识库检索与导游提示词
  app/core/query_normalization.py
                               # 景区专有名词纠错
  scripts/rebuild_demo_knowledge.py
                               # 从两个 Word 文档重建 SQLite 与 Chroma
  scripts/sync_knowledge_chroma.py
                               # 从 SQLite 同步 Chroma 向量库

frontend/
  src/hooks/useXmovAvatar.ts   # 魔珐星云 SDK 加载、连接、播报、停止
  src/hooks/useMediaQuery.ts   # 游客端布局模式判断
  src/pages/tourist/Layout.tsx # mobile/desktop 外壳与导航
  src/pages/tourist/ChatPage.tsx
                               # 云端伴游：数字人/对话框统一问答界面
  src/pages/tourist/HomePage.tsx
                               # 首页：推荐、天气、入口
  src/pages/tourist/TourPage.tsx
                               # 游园地图：高德地图、路线、TTS
  src/pages/tourist/SpotExplorePage.tsx
                               # 胜境风物：景点、天气、评价、打卡、TTS
  src/components/ScenicMap.tsx  # 高德地图组件
  src/config/amap.ts           # 高德 Key 与点位配置
  src/utils/asr.ts             # 前端录音格式与景区词纠错
```

## 环境要求

- Python 3.10 或以上，建议 3.11/3.12。
- Node.js 18 或以上。
- npm 9 或以上。
- Windows、macOS、Linux 均可。本项目本地开发默认使用 Windows PowerShell 示例命令。
- 首次下载 faster-whisper 和 embedding 模型需要联网。

## 1. 克隆仓库

```bash
git clone https://github.com/LilyTLiu/scenic-digital-human-agent.git
cd scenic-digital-human-agent
```

## 2. 后端配置与启动

进入后端目录：

```bash
cd backend
```

创建虚拟环境并安装依赖：

```bash
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt
```

复制环境变量模板：

```bash
copy .env.example .env
# macOS/Linux: cp .env.example .env
```

编辑 `backend/.env`，至少配置：

```env
DEEPSEEK_API_KEY=你的_DeepSeek_API_Key
DEEPSEEK_API_BASE=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=512

GUIDE_REPLY_MAX_CHARS=180
GUIDE_REPLY_BRIEF_CHARS=80

WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
ASR_LANGUAGE=zh
ASR_HF_HUB_OFFLINE=0

TTS_PROVIDER=edge
TTS_VOICE=zh-CN-XiaoxiaoNeural
TTS_TIMEOUT=120
```

说明：

- `DEEPSEEK_API_KEY` 必填，不要提交到 Git。
- `WHISPER_MODEL=base` 是轻量默认值。准确率优先可改为 `small`、`medium` 或 `large-v3`，首次运行会下载模型。
- `ASR_LANGUAGE=zh` 会固定为中文识别。
- `TTS_PROVIDER=edge` 使用免费 Edge TTS，当前游客端对话框默认请求 `zh-CN-XiaoxiaoNeural`。

启动后端：

```bash
python main.py
```

后端默认地址：

- API: `http://localhost:8000`
- API 文档: `http://localhost:8000/docs`

如果出现 `WinError 10048` 或端口占用，说明已有后端占用 8000 端口。先结束旧进程，或修改后端端口后同步修改前端代理。

## 3. 构建知识库

知识库构建脚本会读取仓库中的 `示范景区公开资料包` 下两个 Word 文档，并同时写入 SQLite `data.db` 与 ChromaDB。SQLite 中的 `knowledge_docs` 是管理端可见的知识条目来源，ChromaDB 是问答接口的向量检索索引。若管理端能看到资料但问答检索不到，通常需要重新执行本脚本同步两者。

```bash
cd backend
python scripts/rebuild_demo_knowledge.py
```

首次运行会下载 embedding 模型 `shibing624/text2vec-base-chinese`。如果模型已经下载到本机缓存，后续可在 `.env` 中设置：

```env
HF_HUB_OFFLINE=1
```

当前代码还包含景区专有名词纠错，例如“灵山警区”会纠正为“灵山景区”，“佛祖坛/青筒佛祖印”等误识别会纠正为“佛足坛/青铜佛足印”，再进入 RAG 检索。

## 4. 前端配置与启动

进入前端目录：

```bash
cd frontend
npm install
```

复制环境变量模板：

```bash
copy .env.example .env.local
# macOS/Linux: cp .env.example .env.local
```

编辑 `frontend/.env.local`：

```env
# 导游小文
VITE_XMOV_APP_ID=你的魔珐星云_App_ID
VITE_XMOV_APP_SECRET=你的魔珐星云_App_Secret

# 导游小云
VITE_XMOV_AVATAR_2_ID=第二个魔珐星云_App_ID
VITE_XMOV_AVATAR_2_SECRET=第二个魔珐星云_App_Secret

# 导游小灵
VITE_XMOV_AVATAR_3_ID=第三个魔珐星云_App_ID
VITE_XMOV_AVATAR_3_SECRET=第三个魔珐星云_App_Secret

VITE_XMOV_GATEWAY_SERVER=https://nebula-agent.xingyun3d.com/user/v1/ttsa/session
VITE_XMOV_SDK_URL=https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar@latest.js

# 游园地图
VITE_AMAP_KEY=你的高德 Web端 JS API Key
VITE_AMAP_SECRET=你的高德安全密钥
```

说明：

- 三组 `VITE_XMOV_*` ID/Secret 由魔珐星云数字人平台提供；不配置时云端伴游仍可使用左侧文字/语音问答，但不能连接数字人，未连接状态只显示本地静态形象，不产生魔珐平台计费。
- `VITE_AMAP_KEY` 和 `VITE_AMAP_SECRET` 用于游园地图中的高德地图与步行路径绘制；未配置时组件会回退到静态提示。
- 这些前端环境变量会进入前端构建产物，适合开发和比赛演示。生产环境如果平台支持服务端签名或临时 token，建议改成服务端换取临时凭证。
- 不要提交 `.env.local`。

启动前端：

```bash
npm run dev
```

前端默认地址：

- `https://localhost:5173`

项目使用 Vite 自签名 HTTPS，主要是为了让浏览器允许麦克风录音。首次打开时浏览器会提示证书风险，开发环境选择继续访问即可。

## 5. 使用流程

1. 启动后端：`backend` 下执行 `python main.py`。
2. 启动前端：`frontend` 下执行 `npm run dev`。
3. 浏览器打开 `https://localhost:5173`。
4. 首页进入 `云端伴游`。
5. 在数字人区域选择导游形象，点击“连接数字人”连接魔珐星云数字人。
6. 使用底部输入框发送文字，或点击“麦”录音。
7. 后端 ASR 识别语音，DeepSeek + RAG 生成答案，前端同步：
   - 数字人播报答案。
   - 对话框记录游客问题和数字人回答。
   - 对话框“播报”按钮使用 Xiaoxiao 声音播放答案。
8. 桌面端在同屏对话框查看完整记录；手机端点击“对话框/数字人”切换视图。
9. 游园地图页面可查看景点点位、路线与景点 TTS 播报；胜境风物页面可查看景点详情、天气、评价和打卡。

## 6. 当前链路说明

### 魔珐星云数字人

入口文件：

- `frontend/src/hooks/useXmovAvatar.ts`
- `frontend/src/pages/tourist/ChatPage.tsx`

调用流程：

1. 从 `frontend/.env.local` 读取当前选中导游的 App ID/App Secret、SDK URL、gateway。
2. 动态加载魔珐星云 Web SDK。
3. 初始化 SDK 实例并绑定全屏容器。
4. 用户点击“连接”后建立数字人会话。
5. 问答流式完成后调用 `xmov.speak(reply)`。
6. 用户点击“停止播报”时调用 `interactiveidle()` 中断当前播报。
7. 用户点击“结束”时销毁当前会话，避免持续计费。

### DeepSeek + RAG

入口文件：

- `backend/app/api/chat.py`
- `backend/app/core/llm.py`
- `backend/app/core/rag.py`

调用流程：

1. 前端调用 `/api/chat/stream`。
2. 后端先做景区专有名词纠错。
3. 先从 SQLite 做关键词/专名兜底召回，再从 ChromaDB 做向量召回；票价、大照壁、路线、拈花湾等问题优先召回 Word 对应条目。
4. 构造导游提示词，限制回答精简、基于知识库、不编造；路线问题要求尽量保留 Word 中给出的完整顺序。
5. 调用 DeepSeek 流式接口。
6. SSE token 返回前端，前端实时更新对话框和数字人文本区。

### faster-whisper ASR

入口文件：

- `frontend/src/utils/asr.ts`
- `backend/app/api/voice.py`
- `backend/app/core/asr.py`

调用流程：

1. 前端使用 `MediaRecorder` 录音，自动选择浏览器支持的音频格式。
2. 上传到 `/api/voice/asr`。
3. 后端使用 faster-whisper 识别，默认 `language=zh`。
4. 通过 `ASR_INITIAL_PROMPT` 和 `ASR_HOTWORDS` 加强“灵山胜境、九龙灌浴、佛足坛、青铜佛足印”等词。
5. 返回前做景区词纠错。
6. 纠正后的问题再进入问答链路。

### Xiaoxiao TTS

入口文件：

- `backend/app/core/tts.py`
- `backend/app/api/voice.py`
- `frontend/src/pages/tourist/ChatPage.tsx`

调用流程：

1. 对话框点击“播报”。
2. 前端调用 `/api/voice/tts`，voice 默认传 `zh-CN-XiaoxiaoNeural`。
3. 后端使用 `edge-tts` 合成 MP3。
4. 前端用 `Audio` 播放。

注意：对话框播报声音和魔珐星云数字人平台内置声音是两条链路。当前只切换对话框播报为 Xiaoxiao，不修改魔珐平台中数字人自身的音源。

## 7. 四界面架构

游客端不是复制两套功能，而是同一套功能逻辑、两套布局模式：

- `frontend/src/hooks/useMediaQuery.ts` 判断宽度。
- `frontend/src/pages/tourist/Layout.tsx` 生成 `app-shell--mobile` 或 `app-shell--desktop`。
- `frontend/src/index.css` 中桌面端样式全部挂在 `.app-shell--desktop` 下。

手机端：

- 默认移动端布局。
- `max-width: 480px` 外壳。
- 底部 Tab 导航。

桌面端：

- `min-width: 900px` 时启用。
- 左侧侧边导航。
- 首页负责推荐、天气、快捷入口。
- 云端伴游为对话框 + 数字人同屏布局，底部支持文字、语音和快捷问答。
- 游园地图负责高德地图、景点点位、路线绘制和景点介绍 TTS。
- 胜境风物负责景点介绍、天气动效、评价、打卡和景点介绍 TTS。

后续新增功能时建议：

- API 调用、状态管理、语音、问答等逻辑只写一套。
- 需要差异化布局时，通过 `useTouristLayoutMode()` 判断当前模式。
- 桌面样式写入 `.app-shell--desktop ...` 命名空间，避免影响手机端。

## 8. 常用命令

后端：

```bash
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

前端：

```bash
cd frontend
npm run dev
```

前端生产构建：

```bash
cd frontend
npm run build
```

后端语法检查：

```bash
cd backend
python -m compileall app
```

重建知识库：

```bash
cd backend
python scripts/rebuild_demo_knowledge.py
```

## 9. 局域网访问与麦克风

前端 Vite 已配置 `host: 0.0.0.0`。同一局域网设备可以访问：

```text
https://你的电脑局域网IP:5173
```

查看本机 IP：

```bash
python -c "import socket; s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.connect(('10.255.255.255',1)); print(s.getsockname()[0])"
```

麦克风录音需要 HTTPS 或 localhost 安全上下文。手机访问局域网地址时，需要浏览器允许麦克风权限。

## 10. 常见问题

### 后端启动提示 8000 端口占用

说明已有后端进程在运行。Windows 可查看并结束：

```powershell
Get-NetTCPConnection -LocalPort 8000 | Select-Object LocalAddress,LocalPort,State,OwningProcess
Stop-Process -Id 进程ID
```

### 问答服务不可用

检查：

- `backend/.env` 是否配置 `DEEPSEEK_API_KEY`。
- DeepSeek 账户是否有余额。
- 后端是否在 `http://localhost:8000` 运行。
- 前端是否通过 `npm run dev` 启动。

### 数字人无法连接

检查：

- `frontend/.env.local` 是否配置 `VITE_XMOV_APP_ID` 和 `VITE_XMOV_APP_SECRET`。
- 魔珐星云平台应用是否可用。
- 浏览器控制台是否有 SDK 加载失败或鉴权失败。
- 点击“结束”可主动销毁当前会话，避免持续计费。

### 语音识别失败

检查：

- 浏览器是否允许麦克风权限。
- 是否通过 `https://localhost:5173` 访问。
- 后端是否安装 `faster-whisper` 相关依赖。
- 首次运行是否成功下载 Whisper 模型。

### 语音识别不准确

可在 `backend/.env` 中提高模型：

```env
WHISPER_MODEL=small
```

或继续提高到 `medium`、`large-v3`。模型越大越准确，但下载体积、内存和推理时间也越高。

也可以扩展：

```env
ASR_INITIAL_PROMPT=以下是普通话简体中文灵山景区导游问答...
ASR_HOTWORDS=无锡 灵山胜境 灵山大佛 佛足坛 青铜佛足印 九龙灌浴 梵宫 五印坛城 祥符禅寺
```

### 对话框播报没有声音

检查：

- 后端 `.env` 中 `TTS_PROVIDER=edge`。
- 已重启后端，让 `.env` 生效。
- 浏览器是否允许自动播放，必要时先点击页面任意位置。

## 11. 安全说明

- 不要提交 `backend/.env`、`frontend/.env.local`。
- 不要在 README、截图、日志中公开 DeepSeek API Key、魔珐星云 App ID/App Secret。
- 当前前端 SDK 方式需要在浏览器侧使用魔珐星云配置，适合本地开发和演示；生产环境建议使用平台支持的临时凭证或服务端签名方案。
