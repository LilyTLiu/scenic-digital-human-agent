import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PERSONAS, type PersonaId, DEFAULT_PERSONA } from '../../config/personas'

const isHttps = window.location.protocol === 'https:'
const OAC_BASE = isHttps ? '' : 'http://localhost:8787'

const personaList = Object.values(PERSONAS)

export default function DigitalHumanPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const personaParam = searchParams.get('persona') as PersonaId | null
  const activePersona: PersonaId = personaParam && personaParam in PERSONAS ? personaParam : DEFAULT_PERSONA
  const persona = PERSONAS[activePersona]
  const [iframeReady, setIframeReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [loadStamp, setLoadStamp] = useState(Date.now())
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadIframe = useCallback((stamp: number) => {
    if (!iframeRef.current) return
    iframeRef.current.src = 'about:blank'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.src = `${OAC_BASE}/ui/index.html?t=${stamp}`
        }
      })
    })
  }, [])

  // Init on mount, cleanup on unmount
  useEffect(() => {
    const stamp = Date.now()
    setLoadStamp(stamp)
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank'
      }
    }
  }, [])

  // Load iframe when loadStamp changes
  useEffect(() => {
    loadIframe(loadStamp)
  }, [loadStamp, loadIframe])

  // 8-second error timeout
  useEffect(() => {
    if (iframeReady || loadError) return
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => {
      setLoadError(true)
    }, 8000)
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [loadStamp, iframeReady, loadError])

  const handleReload = useCallback(() => {
    setLoadError(false)
    setIframeReady(false)
    setLoadStamp(Date.now())
  }, [])

  const selectPersona = useCallback(async (id: PersonaId) => {
    if (id === activePersona || switching) return
    setSwitching(true)
    setIframeReady(false)
    setSearchParams({ persona: id })
    try {
      const resp = await fetch('/api/admin/switch-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: id }),
      })
      const data = await resp.json()
      if (data.success) {
        setLoadStamp(Date.now())
      } else {
        setLoadError(true)
      }
    } catch {
      setLoadError(true)
    } finally {
      setSwitching(false)
    }
  }, [activePersona, switching, setSearchParams])

  const onIframeLoad = useCallback(() => {
    setIframeReady(true)
    setLoadError(false)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: '#1a1a2e' }}>
      {/* 顶部角色栏 */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/tourist/chat')}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
            color: '#fff', padding: '6px 8px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 4, fontSize: 12,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
            AI导游 · {persona.name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            {persona.style} · 3D数字人
          </div>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: switching ? '#f0ad4e' : loadError ? '#d9534f' : iframeReady ? '#4cd964' : '#f0ad4e',
          boxShadow: `0 0 6px ${switching ? '#f0ad4e' : loadError ? '#d9534f' : iframeReady ? '#4cd964' : '#f0ad4e'}80`,
        }} />
      </div>

      {/* 角色快速选择 */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)', flexShrink: 0,
        overflowX: 'auto',
      }}>
        {personaList.map((p) => {
          const active = activePersona === p.id
          return (
            <button
              key={p.id}
              onClick={() => selectPersona(p.id)}
              disabled={switching}
              style={{
                padding: '5px 12px', borderRadius: 16,
                border: active ? `1.5px solid ${p.color}` : '1px solid rgba(255,255,255,0.12)',
                background: active ? `${p.color}25` : 'rgba(255,255,255,0.05)',
                color: active ? p.color : 'rgba(255,255,255,0.7)',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: switching ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 4,
                opacity: switching ? 0.5 : 1,
              }}
            >
              {p.image && (
                <img src={p.image} alt={p.name}
                  style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }}
                />
              )}
              {p.name}
            </button>
          )
        })}
      </div>

      {/* iframe 数字人区域 */}
      <div style={{ flex: 1, position: 'relative', background: '#000' }}>
        <iframe
          ref={iframeRef}
          title="LAM 3D Digital Human"
          onLoad={onIframeLoad}
          style={{
            width: '100%', height: '100%', border: 'none',
            opacity: iframeReady ? 1 : 0.3,
            transition: 'opacity 0.5s',
          }}
          allow="microphone; camera; autoplay"
        />
        {loadError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', color: '#fff', gap: 16,
            background: 'rgba(0,0,0,0.85)',
          }}>
            <div style={{ fontSize: 48 }}>🤖</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>数字人加载超时</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '0 24px', lineHeight: 1.6 }}>
              OAC 服务可能未启动或端口冲突：<br />
              <code style={{
                background: 'rgba(255,255,255,0.1)', padding: '4px 8px',
                borderRadius: 4, fontSize: 12, marginTop: 8, display: 'inline-block',
              }}>
                D:\contest\start-oac.bat
              </code>
            </div>
            <button
              onClick={handleReload}
              style={{
                padding: '8px 24px', borderRadius: 20,
                background: 'var(--gold, #c8963e)', border: 'none',
                color: '#fff', fontSize: 14, cursor: 'pointer',
              }}
            >重新连接</button>
          </div>
        )}
        {(!iframeReady && !loadError) && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12,
            pointerEvents: 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.15)',
              borderTopColor: '#c8963e',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {switching ? '正在切换角色...' : '正在加载3D数字人...'}
            </span>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div style={{
        padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
        justifyContent: 'space-between',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          点击上方角色按钮即可切换AI导游形象
        </span>
        <button
          onClick={() => navigate(`/tourist/chat?persona=${activePersona}`)}
          style={{
            padding: '4px 12px', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent', color: 'rgba(255,255,255,0.7)',
            fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          文字对话
        </button>
      </div>
    </div>
  )
}
