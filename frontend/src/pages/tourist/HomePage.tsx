import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import LoginModal from '../../components/LoginModal'
import ProfileDrawer from '../../components/ProfileDrawer'

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

const defaultQuestions = [
  '灵山大佛有多高？',
  '九龙灌浴几点表演？',
  '带孩子怎么玩？',
  '灵山的历史由来？',
  '梵宫有什么看点？',
]

// 根据偏好标签匹配快捷提问
const preferenceQuestions: Record<string, string[]> = {
  '佛教文化': ['灵山大佛的建造背景？', '祥符禅寺千年历史？', '五印坛城有什么特色？'],
  '建筑艺术': ['梵宫的建筑风格有何独特？', '灵山大照壁的雕刻细节？', '九龙灌浴雕塑的设计理念？'],
  '历史典故': ['唐玄奘与小灵山的故事？', '灵山胜境的发展历程？', '赵朴初与灵山的渊源？'],
  '自然风光': ['灵山太湖最佳观景点？', '哪个季节来灵山最美？', '菩提大道有什么植物景观？'],
  '亲子互动': ['带孩子怎么玩灵山？', '九龙灌浴几点表演？', '灵山有哪些互动体验项目？'],
  '禅修体验': ['灵山精舍有禅修课程吗？', '如何预约禅修体验？', '灵山有哪些适合冥想的地方？'],
  '摄影打卡': ['灵山最佳拍照点在哪里？', '梵宫哪个角度拍最好看？', '什么时间拍大佛光线最好？'],
  '美食素斋': ['灵山素食餐厅推荐？', '梵宫素斋有什么特色菜？', '灵山周边有什么美食？'],
}

function getPersonalizedQuestions(interests: string[]): string[] {
  const qs: string[] = []
  for (const tag of interests) {
    const matched = preferenceQuestions[tag]
    if (matched) qs.push(...matched)
  }
  // 取前5个，不足的用默认补齐
  const unique = [...new Set(qs)]
  if (unique.length < 5) {
    for (const dq of defaultQuestions) {
      if (!unique.includes(dq)) unique.push(dq)
      if (unique.length >= 5) break
    }
  }
  return unique.slice(0, 5)
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user, login } = useUser()
  const [loginOpen, setLoginOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const quickQuestions = user?.interests?.length
    ? getPersonalizedQuestions(user.interests)
    : defaultQuestions

  const handleQuickAsk = (q: string) => {
    navigate(`/tourist/chat?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="page-enter tourist-home" style={{ padding: '0 0 32px', position: 'relative' }}>
      {/* === Hero 景区封面 === */}
      <div className="tourist-home-hero" style={{
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

        {/* 右上角个人中心按钮 */}
        <div style={{
          position: 'absolute', top: 12, right: 16, zIndex: 10,
        }}>
          {user ? (
            <button
              onClick={() => setProfileOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px 6px 6px', borderRadius: 20,
                background: 'rgba(255,255,255,0.18)', border: 'none',
                color: '#fff', fontSize: 13, cursor: 'pointer',
                backdropFilter: 'blur(8px)', transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #c8963e, #e88b7e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
              }}>
                {user.nickname?.[0] || '👤'}
              </div>
              <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nickname}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20,
                background: 'rgba(255,255,255,0.18)', border: 'none',
                color: '#fff', fontSize: 13, cursor: 'pointer',
                backdropFilter: 'blur(8px)', transition: 'all 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="8" r="4"/>
                <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
              </svg>
              登录
            </button>
          )}
        </div>

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

          {/* 登录用户问候语 */}
          {user && (
            <div style={{
              marginTop: 16, padding: '10px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              fontSize: 13, lineHeight: 1.5,
            }}>
              👋 欢迎回来，<strong>{user.nickname}</strong>！
              {user.travel_style && (
                <span style={{ marginLeft: 8, opacity: 0.8 }}>
                  已为你定制<strong>{user.travel_style}</strong>专属内容
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === AI数字导游 === */}
      <div className="tourist-home-guide" style={{ padding: '0 20px', marginTop: -20, position: 'relative', zIndex: 2 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 2 }}>AI数字导游</h3>
          <p style={{ fontSize: 13, color: '#9c948c', marginBottom: 16 }}>
            数字人形象 + 灵山知识库问答 + 对话框播报
          </p>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', borderRadius: 14,
            background: '#c8963e0D',
            border: '1.5px solid #c8963e25',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a1a2e, #c8963e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 18,
              boxShadow: '0 3px 12px rgba(200,150,62,0.28)',
              flexShrink: 0,
            }}>AI</div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#c8963e' }}>灵山 AI 导游</span>
              <div style={{ fontSize: 12, color: '#9c948c', marginTop: 2 }}>文字、语音与数字人统一问答</div>
              <div style={{ fontSize: 11, color: '#c8963e', marginTop: 2, fontWeight: 500 }}>
                回答记录会同步展示在对话框中
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 快捷提问 === */}
      <div className="tourist-home-questions" style={{ padding: '0 20px', marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          {user?.interests?.length ? '为你推荐' : '大家都在问'}
        </h3>
        {user?.interests?.length ? (
          <p style={{ fontSize: 12, color: '#9c948c', marginBottom: 12 }}>
            根据你的兴趣偏好 <span style={{ color: '#c8963e', fontWeight: 500 }}>{user.interests.join('、')}</span> 推荐
          </p>
        ) : (
          <p style={{ fontSize: 12, color: '#9c948c', marginBottom: 12 }}>
            登录后可获得个性化推荐
          </p>
        )}
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
      <div className="tourist-home-actions" style={{ padding: '0 20px', marginTop: 28, textAlign: 'center' }}>
        <button
          className="btn-primary"
          style={{ width: '100%', height: 52, fontSize: 17 }}
          onClick={() => navigate('/tourist/chat')}
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
        <button
          className="btn-secondary"
          style={{ width: '100%', height: 48, fontSize: 15, marginTop: 10 }}
          onClick={() => navigate('/tourist/faq')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          使用指南
        </button>
        <p style={{ fontSize: 12, color: '#9c948c', marginTop: 10 }}>
          支持语音输入和文字输入 · 24小时在线
        </p>
      </div>

      {/* 登录弹窗 */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} />

      {/* 个人中心抽屉 */}
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}
