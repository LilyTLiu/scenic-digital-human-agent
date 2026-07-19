import { useState } from 'react'
import { useUser, type UserProfile } from '../contexts/UserContext'

interface Props {
  open: boolean
  onClose: () => void
}

const INTEREST_OPTIONS = ['佛教文化', '建筑艺术', '历史典故', '自然风光', '亲子互动', '禅修体验', '摄影打卡', '美食素斋']
const TRAVEL_STYLE_OPTIONS = ['深度游', '轻松游', '全景游', '亲子游']
const GROUP_TYPE_OPTIONS = ['独自出行', '情侣出游', '家庭出游', '朋友结伴']

export default function ProfileDrawer({ open, onClose }: Props) {
  const { user, updateProfile, logout } = useUser()
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [interests, setInterests] = useState<string[]>(user?.interests || [])
  const [travelStyle, setTravelStyle] = useState(user?.travel_style || '')
  const [groupType, setGroupType] = useState(user?.group_type || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!open || !user) return null

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await updateProfile({
      nickname: nickname.trim() || user.nickname,
      interests,
      travel_style: travelStyle,
      group_type: groupType,
    } as Partial<UserProfile>)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClose = () => {
    setNickname(user?.nickname || '')
    setInterests(user?.interests || [])
    setTravelStyle(user?.travel_style || '')
    setGroupType(user?.group_type || '')
    onClose()
  }

  return (
    <>
      {/* 遮罩 */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.3)',
        }}
        onClick={handleClose}
      />

      {/* 抽屉 */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 1000,
        width: 380, maxWidth: '90vw', background: '#fff',
        boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
        overflow: 'auto',
        animation: 'drawerIn 0.3s ease',
      }}>
        {/* 头部 */}
        <div style={{
          padding: '24px 24px 16px', borderBottom: '1px solid #f0ebe0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#3d3630' }}>
            个人中心
          </h3>
          <button
            onClick={handleClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#f5f1eb', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* 头像区 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8963e, #e88b7e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: '#fff', fontWeight: 700,
              flexShrink: 0,
            }}>
              {user.nickname?.[0] || '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#3d3630' }}>
                {user.nickname}
              </div>
              <div style={{ fontSize: 12, color: '#9c948c', marginTop: 2 }}>
                {user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              </div>
            </div>
          </div>

          {/* 昵称 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#3d3630', display: 'block', marginBottom: 6 }}>
              昵称
            </label>
            <input
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setSaved(false) }}
              maxLength={12}
              placeholder="给自己起个名字吧"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e8e3db', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* 兴趣标签 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#3d3630', display: 'block', marginBottom: 8 }}>
              兴趣偏好（可多选）
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {INTEREST_OPTIONS.map((tag) => {
                const active = interests.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    style={{
                      padding: '5px 14px', borderRadius: 16,
                      border: active ? '1.5px solid #c8963e' : '1px solid #e8e3db',
                      background: active ? '#c8963e15' : '#faf8f5',
                      color: active ? '#c8963e' : '#5c5348',
                      fontSize: 12, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{tag}</button>
                )
              })}
            </div>
          </div>

          {/* 出行风格 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#3d3630', display: 'block', marginBottom: 8 }}>
              出行风格
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TRAVEL_STYLE_OPTIONS.map((s) => {
                const active = travelStyle === s
                return (
                  <button
                    key={s}
                    onClick={() => { setTravelStyle(s); setSaved(false) }}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 10,
                      border: active ? '1.5px solid #c8963e' : '1px solid #e8e3db',
                      background: active ? '#c8963e15' : '#faf8f5',
                      color: active ? '#c8963e' : '#5c5348',
                      fontSize: 12, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{s}</button>
                )
              })}
            </div>
          </div>

          {/* 出行类型 */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#3d3630', display: 'block', marginBottom: 8 }}>
              出行同伴
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GROUP_TYPE_OPTIONS.map((g) => {
                const active = groupType === g
                return (
                  <button
                    key={g}
                    onClick={() => { setGroupType(g); setSaved(false) }}
                    style={{
                      padding: '6px 14px', borderRadius: 16,
                      border: active ? '1.5px solid #c8963e' : '1px solid #e8e3db',
                      background: active ? '#c8963e15' : '#faf8f5',
                      color: active ? '#c8963e' : '#5c5348',
                      fontSize: 12, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{g}</button>
                )
              })}
            </div>
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: saving ? '#e8e3db' : saved ? '#4cd964' : '#c8963e',
              color: '#fff', border: 'none', fontSize: 16, fontWeight: 600,
              cursor: saving ? 'default' : 'pointer', transition: 'all 0.2s',
            }}
          >
            {saved ? '✓ 已保存' : saving ? '保存中...' : '保存设置'}
          </button>

          {/* 退出登录 */}
          <button
            onClick={() => { logout(); onClose() }}
            style={{
              width: '100%', padding: '10px', marginTop: 12,
              borderRadius: 10, background: 'transparent',
              color: '#9c948c', border: '1px solid #e8e3db',
              fontSize: 13, cursor: 'pointer',
            }}
          >退出登录</button>
        </div>

        <style>{`@keyframes drawerIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      </div>
    </>
  )
}
