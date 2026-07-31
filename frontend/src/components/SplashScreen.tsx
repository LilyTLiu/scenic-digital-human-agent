import { useCallback, useEffect, useState } from 'react'

const SPLASH_STORAGE_KEY = 'lingshan_splash_done'
const EXIT_DURATION_MS = 1000

/**
 * 灵山胜境 · 开屏入场动画（乘云而入）
 *
 * 全屏绝对定位遮罩层，罩在主系统外层。
 * - 首次进入播放 "冲破云雾" 的淡出放大效果
 * - 点击任意屏幕区域触发离场动画，结束后从 DOM 安全移除
 * - 会话内刷新页面（sessionStorage 已有标记）直接跳过开屏
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  // 首次进入播放开屏；会话内刷新跳过（sessionStorage 是会话级缓存）
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SPLASH_STORAGE_KEY)) {
        setVisible(true)
        sessionStorage.setItem(SPLASH_STORAGE_KEY, '1')
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const enterHomepage = useCallback(() => {
    if (exiting) return
    // 1. 注入激活动画类，触发 CSS 的 scale + opacity 变化（"破雾"离场）
    setExiting(true)
    // 2. 等待动画平滑播放完毕后，彻底移除组件释放内存
    setTimeout(() => setVisible(false), EXIT_DURATION_MS)
  }, [exiting])

  if (!visible) return null

  return (
    <div
      className={`zen-splash-container${exiting ? ' exit-active' : ''}`}
      onClick={enterHomepage}
    >
      {/* 背景大图层：灵山破晓大图，带有一点向左徐徐移动的电影感 */}
      <div
        className="zen-splash-bg"
        style={{ backgroundImage: "url('/splash-dawn.png')" }}
      />

      {/* 核心文案区域：右侧竖排文人美学 */}
      <div className="zen-splash-content">
        {/* 竖排大标题：灵山胜境（逐字竖排） */}
        <h1 className="zen-title-vertical" aria-label="灵山胜境">
          {['灵', '山', '胜', '境'].map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </h1>

        {/* 竖排副标题 */}
        <p className="zen-subtitle-vertical">乘云而入 · 一山一世界</p>

        {/* 互动小印章按钮：呼吸灯特效 */}
        <div className="zen-seal-btn" role="button" aria-label="进入系统">
          <span className="seal-text">入</span>
        </div>
      </div>
    </div>
  )
}
