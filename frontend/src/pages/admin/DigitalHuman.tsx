import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import { PERSONAS } from '../../config/personas'

interface PersonaInfo {
  id: string
  name: string
  role: string
  style: string
  voice: string
  emoji: string
  color: string
}

export default function DigitalHuman() {
  const [personas, setPersonas] = useState<PersonaInfo[]>([])
  const [activePersona, setActivePersona] = useState('')
  const [switching, setSwitching] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await adminApi.getDigitalHumans()
      setPersonas(res.humans || [])
      setActivePersona(res.active || '')
    } catch {
      // 静默失败，显示空列表
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleActivate = async (id: string) => {
    setSwitching(id)
    try {
      const res = await adminApi.updateDigitalHuman(id, {})
      if (res.success) {
        setActivePersona(id)
      }
    } catch {
      // 切换失败
    } finally {
      setSwitching('')
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <span>加载数字人数据中…</span>
      </div>
    )
  }

  return (
    <div>
      <h2 className="admin-page-title">数字人形象管理</h2>
      <p className="admin-page-subtitle">
        管理灵山导游数字人形象。切换后，游客端3D形象将实时更新。当前语音统一使用妙音的人声。
      </p>

      {/* ── Persona Card Grid ── */}
      {personas.length === 0 ? (
        <div className="admin-empty" style={{ marginBottom: 24 }}>
          暂无数字人数据，请确认后端已启动
        </div>
      ) : (
        <div className="admin-card-grid">
          {personas.map((p) => {
            const isActive = p.id === activePersona
            const isSwitching = switching === p.id
            const personaCfg = PERSONAS[p.id as keyof typeof PERSONAS]

            return (
              <div
                key={p.id}
                className={`admin-persona-card${isActive ? ' admin-persona-card--active' : ''}`}
                style={isActive ? { borderColor: p.color } : undefined}
              >
                {/* Active badge */}
                {isActive && (
                  <span
                    className="admin-tag admin-tag--gold"
                    style={{ position: 'absolute', top: 12, right: 12 }}
                  >
                    当前
                  </span>
                )}

                {/* Avatar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  {personaCfg?.image ? (
                    <img
                      src={personaCfg.image}
                      alt={p.name}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 56, lineHeight: 1 }}>{p.emoji}</span>
                  )}
                </div>

                {/* Name & Role */}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: p.color,
                    marginBottom: 4,
                    textAlign: 'center',
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginBottom: 2, textAlign: 'center' }}>
                  {p.role}
                </div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginBottom: 12, textAlign: 'center' }}>
                  {p.style}
                </div>

                {/* Voice tag */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <span className="admin-tag admin-tag--teal">
                    语音: {p.voice.split('-').pop()}
                  </span>
                </div>

                {/* Activate button */}
                <button
                  className={`admin-btn ${isActive ? 'admin-btn--secondary' : 'admin-btn--primary'}`}
                  style={{
                    width: '100%',
                    ...(isActive ? { borderColor: p.color, color: p.color } : {}),
                  }}
                  disabled={isActive || isSwitching}
                  onClick={() => handleActivate(p.id)}
                >
                  {isActive ? '当前形象' : isSwitching ? '切换中…' : '启用此形象'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Info card ── */}
      <div className="admin-panel" style={{ marginTop: 24 }}>
        <div className="admin-panel-header">
          <div className="admin-panel-title">配置说明</div>
        </div>
        <div
          className="admin-panel-body"
          style={{ fontSize: 13, color: 'var(--admin-text-secondary)', lineHeight: 2 }}
        >
          <p>
            <strong>外观 / 服装：</strong>
            由LAM 3D模型资源包(ZIP)决定，各角色有专属形象。切换即刻生效，游客端iframe自动更新。
          </p>
          <p>
            <strong>声音：</strong>
            由OAC服务端配置决定，当前所有角色共用同一TTS语音。如需为不同角色匹配不同声音，需为每个角色单独创建OAC配置文件并重启服务。
          </p>
          <p>
            <strong>角色属性：</strong>
            名称、风格描述、emoji等元数据在前端 persona.ts 中定义，后端 admin.py PERSONA_ZIP_MAP 维护角色ID到ZIP文件的映射。
          </p>
        </div>
      </div>
    </div>
  )
}
