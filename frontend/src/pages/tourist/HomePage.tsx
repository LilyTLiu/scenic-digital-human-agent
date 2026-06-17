import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PERSONAS, type PersonaId } from '../../config/personas'
import DigitalHuman from '../../components/DigitalHuman'

const scenicSpots = [
  {
    id: 'lingshan',
    name: '灵山胜境',
    subtitle: '世界佛教论坛永久会址',
    tags: ['5A景区', '佛教文化', '太湖风光'],
    cover: 'linear-gradient(135deg, #1a1a2e 0%, #2d4a5e 50%, #c8963e 100%)',
    icon: '🏯',
  },
]

const personaList = Object.values(PERSONAS)

const quickQuestions = [
  '灵山大佛有多高？',
  '九龙灌浴几点表演？',
  '带孩子怎么玩？',
  '灵山的历史由来？',
  '梵宫有什么看点？',
]

export default function HomePage() {
  const navigate = useNavigate()
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('xiaoling')
  const selectedPersonaData = PERSONAS[selectedPersona]

  const handleQuickAsk = (q: string) => {
    navigate(`/tourist/chat?q=${encodeURIComponent(q)}&persona=${selectedPersona}`)
  }

  return (
    <div className="page-enter" style={{ padding: '0 0 32px' }}>
      {/* === Hero 景区封面 === */}
      <div style={{
        background: scenicSpots[0].cover,
        padding: '40px 24px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -30,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{
          position: 'absolute', bottom: 30, left: -40,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            display: 'inline-block', padding: '4px 12px',
            borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: 'rgba(255,255,255,0.18)', color: '#fff',
            marginBottom: 16,
          }}>
            国家AAAAA级旅游景区
          </span>
          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
            {scenicSpots[0].name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 20 }}>
            {scenicSpots[0].subtitle}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {scenicSpots[0].tags.map((t) => (
              <span key={t} style={{
                padding: '3px 10px', borderRadius: 14,
                background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)',
                fontSize: 12,
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* === AI导游选择 === */}
      <div style={{ padding: '0 20px', marginTop: -20, position: 'relative', zIndex: 2 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 2 }}>选择您的AI导游</h3>
          <p style={{ fontSize: 13, color: '#9c948c', marginBottom: 16 }}>
            每位导游有独特的声音和形象，点击选择
          </p>

          {/* 当前选中的数字人预览 */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 16,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              boxShadow: `0 4px 20px ${selectedPersonaData.color}30`,
              transition: 'all 0.3s',
            }}>
              <DigitalHuman
                speaking={false}
                emotion="happy"
                size={80}
                visual={selectedPersonaData.visual}
              />
            </div>
          </div>

          {/* 三个选择按钮 - 不使用嵌套canvas */}
          <div style={{ display: 'flex', gap: 10 }}>
            {personaList.map((p) => {
              const selected = selectedPersona === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPersona(p.id) }}
                  style={{
                    flex: 1, textAlign: 'center', cursor: 'pointer',
                    padding: '12px 6px', borderRadius: 14,
                    border: selected ? `2.5px solid ${p.color}` : '2px solid #e8e3db',
                    background: selected ? `${p.color}0D` : '#faf8f5',
                    transition: 'all 0.25s',
                    outline: 'none',
                    transform: selected ? 'translateY(-3px)' : 'none',
                    boxShadow: selected ? `0 6px 20px ${p.color}25` : '0 1px 2px rgba(0,0,0,0.04)',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    fontSize: 32, lineHeight: 1.2,
                    filter: selected ? 'none' : 'grayscale(30%)',
                    transition: 'all 0.25s',
                    transform: selected ? 'scale(1.15)' : 'scale(1)',
                  }}>
                    {p.emoji}
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 600,
                    color: selected ? p.color : '#3d3630',
                    transition: 'color 0.25s',
                    marginTop: 4,
                  }}>{p.name}</div>
                  <div style={{
                    fontSize: 11, color: p.color, marginTop: 1,
                    fontWeight: selected ? 600 : 400,
                    transition: 'all 0.25s',
                  }}>{p.style}</div>
                  <div style={{ fontSize: 10, color: '#9c948c', marginTop: 1 }}>{p.role}</div>
                  {selected && (
                    <div style={{
                      marginTop: 6, width: 20, height: 20, borderRadius: '50%',
                      background: p.color, color: '#fff', fontSize: 12,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                    }}>✓</div>
                  )}
                  {!selected && (
                    <div style={{ marginTop: 6, width: 20, height: 20 }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* === 快捷提问 === */}
      <div style={{ padding: '0 20px', marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>大家都在问</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleQuickAsk(q)
              }}
              style={{
                padding: '8px 16px', borderRadius: 20,
                background: '#f5f1eb', border: 'none',
                fontSize: 13, color: '#5c5348', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{q}</button>
          ))}
        </div>
      </div>

      {/* === 开始按钮 === */}
      <div style={{ padding: '0 20px', marginTop: 28, textAlign: 'center' }}>
        <button
          className="btn-primary"
          style={{ width: '100%', height: 52, fontSize: 17 }}
          onClick={() => navigate(`/tourist/chat?persona=${selectedPersona}`)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          开始AI问答
        </button>
        <button
          className="btn-secondary"
          style={{ width: '100%', height: 48, fontSize: 15, marginTop: 10 }}
          onClick={() => navigate('/tourist/tour')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <polygon points="9,21 15,21 17,17 7,17"/>
          </svg>
          景区导览演示
        </button>
        <p style={{ fontSize: 12, color: '#9c948c', marginTop: 10 }}>
          支持语音输入和文字输入 · 24小时在线
        </p>
      </div>
    </div>
  )
}
