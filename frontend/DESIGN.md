---
name: 灵山胜境 AI 数字人导游
description: 无锡灵山胜境景区的 AI 数字人导游系统，暖金/青绿品牌色系，移动优先，桌面侧栏自适应
colors:
  真金: "#c8963e"
  真金浅: "#e8c97a"
  真金深: "#a0722a"
  琉璃青: "#2d8a7b"
  琉璃青浅: "#4aab9b"
  素绢: "#faf7f2"
  暖白: "#fffcf7"
  墨炭: "#3d3630"
  石灰: "#f3f1ed"
  古铜: "#9b8465"
  云灰: "#9c948c"
  薄灰: "#e8e3db"
  暖灰: "#f5f1eb"
  柔赤: "#e88b7e"
typography:
  display:
    fontFamily: "'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', sans-serif"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', sans-serif"
    fontWeight: 500
    fontSize: "11px"
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "22px"
  full: "28px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "40px"
components:
  button-primary:
    backgroundColor: "{colors.真金}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "14px 32px"
  button-secondary:
    backgroundColor: "{colors.暖灰}"
    textColor: "{colors.墨炭}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  glass-card:
    backgroundColor: "rgba(255, 255, 255, 0.42)"
    textColor: "{colors.墨炭}"
    rounded: "{rounded.lg}"
  tab-item:
    backgroundColor: "transparent"
    textColor: "{colors.云灰}"
    rounded: "{rounded.sm}"
  tab-item-active:
    backgroundColor: "rgba(200, 150, 62, 0.14)"
    textColor: "{colors.真金}"
    rounded: "{rounded.sm}"
---

# Design System: 灵山胜境 AI 数字人导游

## Overview

**Creative North Star: "琉璃禅境"**

灵山胜境数字人导游的设计语言源于无锡灵山景区的材质本真：琉璃的通透、古铜的温润、素绢的柔和。系统以暖金（真金）和青绿（琉璃青）为主品牌色，构建一个既庄严又亲切的佛教文化旅游数字体验。

系统采用**双材质策略**：交互层（导航、按钮、表单）使用暖色平面语言，强调可识别性和触达效率；内容展示层（景点卡片、详情面板）引入液态玻璃材质——半透明白底 + backdrop-blur + 内高光边缘——营造"透过琉璃看灵山"的视觉联想。两种材质共享同一套色彩和间距基础，在真金色作为统一线索下自然过渡。

整体气质：温润克制，留白从容。移动端为 480px 居中的单列 App 壳，桌面端通过 92px 侧栏导航扩展为宽屏内容网格。所有动画使用 expo-out 缓动曲线，不做弹跳和过度表现。

**Key Characteristics:**
- 暖金/青绿双主色，源自灵山景区的琉璃、古铜、素绢材质
- 双材质系统：平面交互层 + 液态玻璃内容层，各司其职
- 移动优先 480px 壳，桌面 ≥900px 侧栏自适应
- 投影全为暖色调（墨炭基底），拒绝纯黑阴影
- expo-out 缓动主导，`prefers-reduced-motion` 完全降级

## Colors

灵山景区的材质色盘：琉璃的金光、青绿的深邃、素绢的温润、古铜的沉静。

### Primary
- **真金** (#c8963e): 主品牌色。用于导航激活态、主按钮、品牌点缀、重要标签。饱和但不过艳，在暖色底上自然浮现。
- **真金浅** (#e8c97a): 真金的提亮变体。用于渐变过渡、次要装饰。
- **真金深** (#a0722a): 真金的压暗变体。用于按钮 hover 态（渐变加深）、文字链接 hover。

### Secondary
- **琉璃青** (#2d8a7b): 辅助品牌色。用于自然风光相关标签、路线标识、区域装饰。代表灵山的自然山水维度。
- **琉璃青浅** (#4aab9b): 琉璃青的提亮变体。用于浅色背景上的琉璃青元素。

### Neutral
- **素绢** (#faf7f2): 全局页面基底色。暖调米白，比纯白更柔和，模拟丝绸质感。
- **暖白** (#fffcf7): App 壳内背景色。比素绢更亮一级，用于卡片容器之上。
- **石灰** (#f3f1ed): 液态玻璃页面的背景色。比素绢偏灰偏冷，为玻璃透光提供层次。
- **墨炭** (#3d3630): 主文本色。暖调深灰，不是纯黑。
- **云灰** (#9c948c): 辅助文本色。用于副标题、提示、占位符。
- **薄灰** (#e8e3db): 分割线和边框色。暖调浅灰。
- **暖灰** (#f5f1eb): 次要按钮和标签底色。暖调极浅灰。

### Accent
- **古铜** (#9b8465): 液态玻璃系统的强调色。降饱和的暖棕，用于卡片副标题、标签文字、信息框左边条。是真金的沉静替代。
- **柔赤** (#e88b7e): 暖调柔红。用于亲子路线、温馨情感标记。仅在有语义需求时使用。

### Named Rules

**The One Gold Rule.** 真金色在一屏内出现的面积不超过 10%。它用于激活态和关键 CTA，不是装饰色。大面积金色会让庄严感滑向浮华。

**The Two-Theme Transition Rule.** 从平面交互层进入液态玻璃内容层时，真金让位给古铜，素绢让位给石灰。两个子系统的色彩温差不超过 5%（都是暖调基底），过渡自然不突兀。

## Typography

**Display Font:** Noto Serif SC (with Songti SC / STSong / SimSun fallback)
**Body Font:** System sans-serif stack (-apple-system / PingFang SC / Microsoft YaHei)
**Label/Mono Font:** Same system sans-serif stack.

**Character:** 衬线用于标题和景点名称，带来编辑感和文化重量；无衬线用于正文和交互元素，保证移动端小字号的可读性。衬线只出现在内容展示层，交互层全用无衬线。

### Hierarchy
- **Display** (600, 24-32px/clamp, 1.2-1.25): 页面标题。用于导览页头、路线推荐页头。仅衬线体。
- **Headline** (600-700, 17-22px, 1.25): 景点卡片名称、详情面板景点名。衬线体。
- **Title** (600, 15-18px, 1.4): 段落标题、卡片标题、对话框标题。无衬线体。
- **Body** (400, 13-14px, 1.65-1.8): 正文。用于景点描述、路线说明。最大行宽 65ch。
- **Label** (500, 11-12.5px, 0.01em): 标签、副标题、提示文字。用于卡片标签、输入框标注。

### Named Rules

**The Serif-for-Content Rule.** 衬线体仅用于内容展示页面的标题和景点名称。导航、按钮、表单、标签、对话消息全部使用无衬线体。系统级 UI 不用衬线。

## Layout

**移动端 (默认，< 900px):** App 壳最大宽度 480px，水平居中。内容区域 `padding-bottom: 72px` 为底部 Tab 导航预留空间。单列垂直流布局。

**桌面端 (≥ 900px, `.app-shell--desktop`):** 左侧 92px 固定侧栏导航（`grid-template-columns: 92px minmax(0, 1fr)`），内容区 `overflow: auto` 独立滚动。各页面使用 `max-width` 容器（导览 1200px，推荐 1180px，对话 960px）。

**平板过渡 (900-1180px):** 卡片网格从 3 列降为 2 列，详情面板宽度收缩至 520px。

**间距节奏:** 4px 基础栅格。常用间距序列：8 / 12 / 14 / 16 / 18 / 20 / 24 / 28 / 32 / 36 / 40 / 48。页面级 padding 随视口增大：移动 16-20px，桌面 32-40px。

**导览页特殊布局:** `display: flex; flex-direction: column; height: 100vh; overflow: hidden`。Header 固定顶部的，卡片网格 flex:1 内滚动，详情为 fixed overlay。

## Elevation & Depth

系统采用**分层各表**策略：每种表面类型有且仅有一种深度表达方式。

- **导航层 (平面):** Tab 栏使用 `backdrop-filter: blur(20px)` 毛玻璃 + 底部细线。深度来自模糊而非投影。
- **卡片层 (玻璃):** 液态玻璃卡片使用双层暖灰投影（`2px/16px` 近距 + `8px/32px` 远距）+ 顶部内高光 (`inset 0 1px 0`)。深度来自玻璃折射感而非单纯的 elevation。
- **模态层 (深遮罩):** 详情面板 overlay 使用 `rgba(44,41,38,0.35)` + `backdrop-filter: blur(6px)` 的暖色深遮罩。面板本身有定向阴影（移动端顶部，桌面端四周）。

### Shadow Vocabulary
- **ambient-sm** (`0 1px 3px rgba(61,54,48,0.06)`): 旧版卡片微投影。用于低层级容器。
- **ambient-md** (`0 4px 16px rgba(61,54,48,0.08)`): 旧版卡片中投影。用于推荐页卡片。
- **ambient-lg** (`0 8px 32px rgba(61,54,48,0.12)`): 旧版大投影。保留未广泛使用。
- **glass-rest** (`0 2px 16px rgba(44,41,38,0.04), 0 8px 32px rgba(44,41,38,0.05), inset 0 1px 0 rgba(255,255,255,0.60)`): 液态玻璃卡片静止态。
- **glass-hover** (`0 4px 24px rgba(44,41,38,0.06), 0 14px 40px rgba(44,41,38,0.09), inset 0 1px 0 rgba(255,255,255,0.72)`): 液态玻璃卡片悬停态。上浮 4px + 阴影加深 + 边框变亮。
- **panel-mobile** (`0 -4px 32px rgba(44,41,38,0.10), 0 -1px 0 rgba(255,255,255,0.50), inset 0 1px 0 rgba(255,255,255,0.55)`): 底部滑入面板。阴影方向朝上。

### Named Rules

**The Tinted-Shadow Rule.** 所有投影使用墨炭（#3d3630 或 #2c2926）的 rgba，绝不用纯黑。投影色调与页面基底保持一致。

**The One-Surface One-Depth Rule.** 同一表面类型不混用两种深度表达。玻璃卡片只用玻璃投影，平面卡片只用 ambient 投影。从不在玻璃卡片上加 ambient 阴影。

## Shapes

**形状策略:** 系统使用两套圆角，一套用于交互层（较小的 8-14px），一套用于内容玻璃层（较大的 20-22px）。

- **按钮 (交互层):** 全圆角 28px（pill 形）。表达可点击的亲和力。
- **旧版卡片 (交互层):** 14px 圆角。温和但不失边界感。
- **液态玻璃卡片 (内容层):** 20px 圆角。更圆润，配合玻璃材质的通透感。
- **玻璃详情面板 (内容层):** 22px 圆角。移动端仅顶部圆角（底部贴合屏幕），桌面端全圆角（居中模态）。
- **标签/药丸:** 8px 圆角。小而精致。
- **详情信息框:** 12px 圆角，左侧 3px 古铜色实边条。
- **桌面侧栏导航项:** 8px 圆角，hover 时出现暖金底色。

### Named Rules

**The Two-Radius Rule.** 交互层（按钮、导航、表单）使用 8-14px 圆角家族；内容展示层（玻璃卡片、详情面板）使用 20-22px 圆角家族。同一页面内不跨家族混用。

## Components

### Buttons

- **Shape:** 全圆角 pill (28px)。
- **Primary:** 真金渐变背景 (`linear-gradient(135deg, #c8963e, #a0722a)`)，白色文字，14px 32px padding，0 4px 16px 真金投影。`:active` 时 scale(0.97) + 投影减半。
- **Secondary:** 暖灰底色，墨炭文字，1px 薄灰边框，10px 20px padding。`:hover` 时淡入。
- **玻璃按钮 (内容层):** 半透白底 + backdrop-blur(10px)，古铜边框，墨炭文字，14px 圆角。主变体有古铜底色加深。用于详情面板。

### Navigation

- **移动端 Tab Bar:** 底部固定，480px 宽，60px 高，`rgba(255,255,255,0.92)` + `backdrop-filter: blur(20px)`。激活项真金色 + 短暂弹跳动画。
- **桌面端侧栏:** 左侧 92px 固定，`rgba(255,252,247,0.92)` 毛玻璃背景。顶部 "灵山" 品牌标识（深墨绿底 + 暖金文字）。导航项 8px 圆角，hover 暖金底色，激活态 `inset` 描边。
- **图标:** 22-24px SVG，stroke-width 2-2.5。

### Cards / Containers

- **旧版卡片 (.card):** 白色底，14px 圆角，ambient-sm 投影。用于首页、推荐页等交互层页面。
- **液态玻璃卡片 (.glass-card):** `rgba(255,255,255,0.42)` + `backdrop-filter: blur(18px) saturate(140%)`，20px 圆角，1px 半透白边框。顶部 180-200px 图片区（渐变遮罩过渡到玻璃），底部 14-16px padding 内容区。悬停上浮 4px + 阴影加深 + 图片 scale(1.06)。入场有 stagger 错峰动画。
- **路线卡片:** 白色底 + 左侧 4px 彩色边条，可展开的时间轴详情。

### Chips / Tags

- **旧版标签:** 景点色 10% 透明底 + 景点色字，10px 圆角。
- **玻璃标签 (.glass-card-tag):** 古铜微底色 + 古铜文字，8px 圆角。悬停时底色加深至 14%。
- **路线标签:** 品牌色 12% 透明底 + 品牌色字，10px 圆角。

### Detail Panel

- **移动端:** 底部滑入面板，`max-height: 82vh`，顶部 22px 圆角，底部平齐。玻璃材质 (`rgba(255,255,255,0.68)` + `backdrop-filter: blur(24px)`)。顶部 200px 景点图片，内容区 18-20px padding。右上角 34px 圆形玻璃关闭按钮。
- **桌面端:** 居中模态 (620px 宽)，全 22px 圆角。`panelIn` 动画 (translateY 20→0 + scale 0.96→1)。顶部 240px 图片。

### Inputs / Fields

- **聊天输入:** 多行 textarea + 发送按钮，圆角 8px（桌面端）。`rgba(255,255,255,0.90)` 背景。
- **登录表单:** Ant Design 组件，品牌色主题。

## Do's and Don'ts

### Do:
- **Do** 在所有投影中使用暖色墨炭 rgba（#3d3630 或 #2c2926），不用纯黑
- **Do** 衬线体仅用于内容展示标题，交互 UI 全用无衬线
- **Do** 每个表面类型只使用一种深度表达方式
- **Do** 真金色在一屏内保持 10% 以下面积
- **Do** 过渡动画使用 `cubic-bezier(0.16, 1, 0.3, 1)` expo-out
- **Do** 内容层使用玻璃材质（blur + 半透明 + 内高光）时，页面背景必须有柔光渐变来衬托

### Don't:
- **Don't** 在玻璃卡片上叠加 ambient 投影
- **Don't** 用高饱和度色（> 80% saturation）作为大面积背景或主色
- **Don't** 在非内容展示页使用衬线体
- **Don't** 用纯黑 #000000 或纯白 #ffffff 作为大面积底色
- **Don't** 混合使用两套圆角家族（交互层 8-14px 和内容层 20-22px 不在同一页面混用）
- **Don't** 忽略 `prefers-reduced-motion`——所有动画必须有降级路径
