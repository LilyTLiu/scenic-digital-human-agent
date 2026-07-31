import { useEffect, useState } from 'react'
import {
  getXmovAvatarProfile,
  XMOV_AVATAR_PROFILES,
  XMOV_AVATAR_STORAGE_KEY,
} from '../../config/xmovAvatars'

export default function DigitalHuman() {
  const [activeKey, setActiveKey] = useState(() => {
    try {
      return getXmovAvatarProfile(localStorage.getItem(XMOV_AVATAR_STORAGE_KEY)).key
    } catch {
      return XMOV_AVATAR_PROFILES[0].key
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(XMOV_AVATAR_STORAGE_KEY, activeKey)
    } catch { /* ignore */ }
  }, [activeKey])

  return (
    <div>
      <h2 className="admin-page-title">数字人形象管理</h2>
      <p className="admin-page-subtitle">
        管理游客端「云端伴游」使用的魔珐星云数字人形象。当前页面与游客端共用同一套配置和本机选择状态。
      </p>

      <div className="admin-card-grid">
        {XMOV_AVATAR_PROFILES.map((profile) => {
          const isActive = profile.key === activeKey
          const configured = Boolean(profile.appId && profile.appSecret)
          const appIdText = profile.appId
            ? `${profile.appId.slice(0, 6)}...${profile.appId.slice(-6)}`
            : '未配置'

          return (
            <div
              key={profile.key}
              className={`admin-persona-card${isActive ? ' admin-persona-card--active' : ''}`}
              style={isActive ? { borderColor: '#c8963e' } : undefined}
            >
              {isActive && (
                <span
                  className="admin-tag admin-tag--gold"
                  style={{ position: 'absolute', top: 12, right: 12 }}
                >
                  当前
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <img
                  src={profile.standbyImage}
                  alt={profile.name}
                  style={{
                    width: 86,
                    height: 112,
                    borderRadius: 10,
                    objectFit: 'contain',
                    background: 'rgba(200,150,62,0.06)',
                    border: '1px solid rgba(200,150,62,0.16)',
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#7d5b26',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                {profile.name}
              </div>

              <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                <span className={`admin-tag ${configured ? 'admin-tag--teal' : 'admin-tag--gray'}`}>
                  {configured ? '魔珐星云已配置' : '魔珐星云未配置'}
                </span>
                <span className="admin-tag admin-tag--gold">App ID: {appIdText}</span>
                <span className="admin-tag admin-tag--teal">语音播报: zh-CN-XiaoxiaoNeural</span>
              </div>

              <button
                className={`admin-btn ${isActive ? 'admin-btn--secondary' : 'admin-btn--primary'}`}
                style={{ width: '100%' }}
                disabled={isActive}
                onClick={() => setActiveKey(profile.key)}
              >
                {isActive ? '当前游客端默认形象' : '设为游客端默认形象'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="admin-panel" style={{ marginTop: 24 }}>
        <div className="admin-panel-header">
          <div className="admin-panel-title">配置说明</div>
        </div>
        <div
          className="admin-panel-body"
          style={{ fontSize: 13, color: 'var(--admin-text-secondary)', lineHeight: 2 }}
        >
          <p>
            <strong>游客端联动：</strong>
            此页面使用的形象、静态待机图、App ID 和 Secret 均来自游客端同一份
            <code style={{ margin: '0 4px' }}>xmovAvatars</code>
            配置，因此不会再出现管理端与游客端数字人列表不一致。
          </p>
          <p>
            <strong>密钥配置：</strong>
            请在 <code>frontend/.env.local</code> 中维护三组
            <code>VITE_XMOV_*</code> 配置；管理端只展示脱敏后的 App ID，不显示 Secret。
          </p>
          <p>
            <strong>语音说明：</strong>
            魔珐星云数字人自己的口型/声源仍由平台会话决定；对话框文字播报继续使用
            <code>zh-CN-XiaoxiaoNeural</code>。
          </p>
        </div>
      </div>
    </div>
  )
}
