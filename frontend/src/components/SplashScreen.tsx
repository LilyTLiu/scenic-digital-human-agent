import { useCallback, useEffect, useState } from 'react'

const SPLASH_STORAGE_KEY = 'lingshan_splash_done'
const EXIT_DURATION_MS = 1000

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 900px)')
    if (!desktopQuery.matches) {
      setVisible(false)
      return
    }

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
    setExiting(true)
    setTimeout(() => setVisible(false), EXIT_DURATION_MS)
  }, [exiting])

  if (!visible) return null

  return (
    <div
      className={`zen-splash-container${exiting ? ' exit-active' : ''}`}
      onClick={enterHomepage}
    >
      <div
        className="zen-splash-bg"
        style={{ backgroundImage: "url('/splash-dawn.png')" }}
      />

      <div className="zen-splash-content">
        <h1 className="zen-title-vertical" aria-label="灵山胜境">
          {['灵', '山', '胜', '境'].map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </h1>
        <p className="zen-subtitle-vertical">乘云而入 · 一山一世界</p>
        <div className="zen-seal-btn" role="button" aria-label="进入系统">
          <span className="seal-text">入</span>
        </div>
      </div>
    </div>
  )
}
