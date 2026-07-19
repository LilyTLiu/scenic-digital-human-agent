import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PERSONAS, type PersonaId, DEFAULT_PERSONA } from '../../config/personas'

const OAC_BASE = 'http://localhost:8787'

const personaList = Object.values(PERSONAS)

export default function DigitalHumanPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const personaParam = searchParams.get('persona') as PersonaId | null
  const activePersona: PersonaId = personaParam && personaParam in PERSONAS ? personaParam : DEFAULT_PERSONA
  const persona = PERSONAS[activePersona]
  const [loadError, setLoadError] = useState(false)
  const [switching, setSwitching] = useState(false)

  // 打开数字人页面
  const openOAC = useCallback(() => {
    window.open(`${OAC_BASE}/ui/index.html`, '_blank', 'noopener,noreferrer')
  }, [])

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
      background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
      alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 24,
      padding: 24,
    }}>
      {/* 角色选择 */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: 2 }}>3D 数字人导游</h2>
      </div>

      {/* 当前导游大图 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 130, height: 130, borderRadius: '50%', margin: '0 auto',
          overflow: 'hidden', position: 'relative',
          boxShadow: `0 0 30px ${persona.color}60, 0 0 60px ${persona.color}30`,
          border: `3px solid ${persona.color}`,
          transition: 'all 0.4s ease',
        }}>
          {persona.image && (
            <img src={persona.image} alt={persona.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            />
          )}
        </div>
        <div style={{ marginTop: 14 }}>
          <span style={{
            fontSize: 20, fontWeight: 700, color: '#fff', display: 'block',
          }}>{persona.name}</span>
          <span style={{
            display: 'inline-block', marginTop: 6, padding: '2px 12px', borderRadius: 10,
            background: persona.color + '30', color: persona.color,
            fontSize: 12, fontWeight: 500,
          }}>{persona.role}</span>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 }}>
            {persona.style} · 在线
          </p>
        </div>
      </div>

      {/* 导游选择卡片 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {personaList.map((p) => {
          const active = activePersona === p.id
          return (
            <button
              key={p.id}
              onClick={() => selectPersona(p.id)}
              disabled={switching}
              style={{
                padding: 0, border: 'none', background: 'transparent',
                cursor: switching ? 'wait' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                opacity: active ? 1 : 0.55,
                transition: 'all 0.25s',
                filter: active ? 'none' : 'grayscale(0.6)',
                transform: active ? 'scale(1.05)' : 'scale(0.95)',
              }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1)' } }}
              onMouseOut={e => { if (!active) { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.transform = 'scale(0.95)' } }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                border: active ? `2.5px solid ${p.color}` : '2px solid rgba(255,255,255,0.15)',
                boxShadow: active ? `0 0 16px ${p.color}50` : 'none',
                transition: 'all 0.25s',
              }}>
                {p.image && (
                  <img src={p.image} alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                  />
                )}
              </div>
              <span style={{
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? p.color : 'rgba(255,255,255,0.5)',
              }}>{p.name}</span>
            </button>
          )
        })}
      </div>

      {/* 打开按钮 */}
      <button
        onClick={openOAC}
        style={{
          padding: '14px 48px', borderRadius: 28,
          background: 'linear-gradient(135deg, #c8963e, #e8b84e)',
          border: 'none', color: '#fff', fontSize: 16, fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(200,150,62,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          marginTop: 8,
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(200,150,62,0.5)'
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(200,150,62,0.4)'
        }}
      >
        🚀 打开 3D 数字人
      </button>

      {loadError && (
        <div style={{ color: '#d9534f', fontSize: 13, padding: '8px 16px', background: 'rgba(217,83,79,0.1)', borderRadius: 8 }}>
          角色切换失败，请重试
        </div>
      )}

      {/* 说明 */}
      <div style={{
        marginTop: 20, padding: '16px 20px', borderRadius: 12,
        background: 'rgba(255,255,255,0.05)', maxWidth: 400,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          3D 数字人页面将在新窗口中打开。<br />
          需要浏览器允许弹出窗口（当前窗口不会被拦截）。
        </div>
      </div>

      {/* 底部按钮 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={() => navigate('/tourist/chat')}
          style={{
            padding: '8px 20px', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent', color: 'rgba(255,255,255,0.7)',
            fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          💬 文字对话
        </button>
      </div>
    </div>
  )
}
