import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PERSONAS, type PersonaId, DEFAULT_PERSONA } from '../../config/personas'

const OAC_BASE = 'http://localhost:8787'

const personaList = Object.values(PERSONAS)

export default function RealHumanPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const personaParam = searchParams.get('persona') as PersonaId | null
  const activePersona: PersonaId = personaParam && personaParam in PERSONAS ? personaParam : DEFAULT_PERSONA
  const persona = PERSONAS[activePersona]
  const [loadError, setLoadError] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [oacLoaded, setOacLoaded] = useState(false)

  const selectPersona = useCallback(async (id: PersonaId) => {
    if (id === activePersona || switching) return
    setSwitching(true)
    setSearchParams({ persona: id })
    try {
      const resp = await fetch('/api/admin/switch-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: id }),
      })
      const data = await resp.json()
      if (!data.success) {
        setLoadError(true)
      }
    } catch {
      setLoadError(true)
    } finally {
      setSwitching(false)
    }
  }, [activePersona, switching, setSearchParams])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)',
      background: '#000', position: 'relative', overflow: 'hidden',
    }}>
      {/* OAC WebUI 全屏嵌入 */}
      <iframe
        src={`${OAC_BASE}/ui/index.html`}
        onLoad={() => setOacLoaded(true)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          border: 'none', display: oacLoaded ? 'block' : 'none',
        }}
        allow="microphone; camera; autoplay"
      />

      {/* 加载中遮罩 */}
      {!oacLoaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)',
        }}>
          <div style={{
            width: 130, height: 130, borderRadius: '50%', overflow: 'hidden',
            boxShadow: `0 0 30px ${persona.color}60, 0 0 60px ${persona.color}30`,
            border: `3px solid ${persona.color}`,
            marginBottom: 20, transition: 'all 0.4s ease',
          }}>
            {persona.image && (
              <img src={persona.image} alt={persona.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              />
            )}
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {persona.name}
          </div>
          <div style={{
            display: 'inline-block', padding: '2px 12px', borderRadius: 10,
            background: persona.color + '30', color: persona.color,
            fontSize: 12, fontWeight: 500, marginBottom: 12,
          }}>{persona.role}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            正在加载数字人引擎...
          </div>
          <div style={{
            marginTop: 16, width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(200,150,62,0.3)',
            borderTopColor: '#c8963e',
            animation: 'oacSpin 0.8s linear infinite',
          }} />
          {loadError && (
            <div style={{ color: '#d9534f', fontSize: 13, marginTop: 12 }}>
              加载失败，请刷新重试
            </div>
          )}
        </div>
      )}

      {/* 顶部导航栏 — 透明悬浮 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '10px 14px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: oacLoaded ? '#4cd964' : '#f0ad4e',
          boxShadow: oacLoaded ? '0 0 8px #4cd964' : '0 0 8px #f0ad4e',
        }} />
        <div style={{
          width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          border: `1.5px solid ${persona.color}60`,
        }}>
          {persona.image && <img src={persona.image} alt={persona.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />}
        </div>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, flex: 1 }}>
          {persona.name} · {persona.style}
        </span>

        {/* 角色切换 */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {personaList.map((p) => (
            <button key={p.id} onClick={() => selectPersona(p.id)} disabled={switching}
              style={{
                padding: '2px', borderRadius: '50%',
                border: activePersona === p.id ? `2px solid ${p.color}` : '2px solid transparent',
                background: activePersona === p.id ? `${p.color}40` : 'rgba(255,255,255,0.08)',
                cursor: switching ? 'wait' : 'pointer', width: 30, height: 30, overflow: 'hidden',
                transition: 'all 0.2s',
                opacity: activePersona === p.id ? 1 : 0.5,
                transform: activePersona === p.id ? 'scale(1.05)' : 'scale(0.95)',
              }}>
              {p.image && <img src={p.image} alt={p.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />}
            </button>
          ))}
        </div>

        {/* 返回按钮 */}
        <button onClick={() => navigate('/tourist')}
          style={{
            padding: '3px 10px', borderRadius: 12, border: 'none',
            background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
            fontSize: 11, cursor: 'pointer', marginLeft: 4,
            backdropFilter: 'blur(4px)',
          }}>
          ✕
        </button>
      </div>

      <style>{`
        @keyframes oacSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
