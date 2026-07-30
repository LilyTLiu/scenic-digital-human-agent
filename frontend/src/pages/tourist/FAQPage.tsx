import { useNavigate } from 'react-router-dom'
import { PERSONAS } from '../../config/personas'

const personaList = Object.values(PERSONAS)

const faqs = [
  {
    q: '灵山AI导游是什么？',
    a: '灵山AI导游是基于大语言模型和3D数字人技术的智能导览系统。您可以通过文字或语音与数字人导游对话，了解灵山胜境的历史文化、景点介绍、游览路线等信息。',
  },
  {
    q: '如何使用语音对话？',
    a: '在AI导游对话页面，点击麦克风按钮即可开始语音输入。浏览器会请求麦克风权限，授权后即可进行语音对话。如果浏览器不支持麦克风，可以使用文字输入。',
  },
  {
    q: '3D数字人如何查看？',
    a: '点击底部导航栏的"AI数字人"标签，可以看到3D数字人导游的实时动画。数字人会根据语音内容自动生成对应的口型和表情。首次加载可能需要几秒钟。',
  },
  {
    q: '支持哪些导游角色？',
    a: '目前支持4位AI导游：热情专业的小灵、沉稳博学的慧觉（已更名为小山）、优雅灵动的妙音、禅意智慧的小禅。每位导游有独特的声音和讲解风格。',
  },
  {
    q: '数字人需要什么浏览器支持？',
    a: '3D数字人需要支持WebGL的现代浏览器（Chrome、Edge、Firefox等）。建议使用最新版本的浏览器以获得最佳体验。移动端浏览器同样支持。',
  },
  {
    q: '如何进行景区导览？',
    a: '点击底部"导览"标签可以查看灵山胜境的交互式地图，点击各个景点标记可查看详细介绍和图片。您也可以直接向AI导游询问特定景点的信息。',
  },
  {
    q: '语音播报如何工作？',
    a: 'AI导游的回复会自动通过浏览器语音合成或Edge TTS服务进行播报。点击消息下方的"播报"按钮可以重新播放，再次点击可以停止播报。',
  },
]

const features = [
  {
    icon: '💬',
    title: '智能问答',
    desc: '基于大语言模型，深度了解灵山胜境的历史文化、建筑特色、佛教艺术，为您提供精准专业的导览讲解。',
  },
  {
    icon: '🎤',
    title: '语音交互',
    desc: '支持语音输入和语音播报，解放双手，让您在游览过程中更加便捷地获取信息。',
  },
  {
    icon: '🤖',
    title: '3D数字人',
    desc: '基于LAM大型头像模型，实时生成逼真的面部表情和口型动画，让AI导游栩栩如生。',
  },
  {
    icon: '🗺️',
    title: '智能导览',
    desc: '交互式景区地图，覆盖灵山大佛、九龙灌浴、梵宫、五印坛城、祥符禅寺等主要景点。',
  },
  {
    icon: '🧭',
    title: '路线推荐',
    desc: '根据您的游览时间和兴趣偏好，智能推荐最佳游览路线，轻松规划您的灵山之旅。',
  },
  {
    icon: '📱',
    title: '随时随地',
    desc: '适配手机和电脑浏览器，无论是在家中做攻略还是在景区现场，都能随时使用AI导游服务。',
  },
]

export default function FAQPage() {
  const navigate = useNavigate()

  return (
    <div className="page-enter" style={{ padding: '0 0 32px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        padding: '36px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -20,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="guofeng-title" style={{ color: '#fff', fontSize: 26, marginBottom: 8 }}>
            🤖 灵山AI导游使用指南
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>
            欢迎使用灵山胜境智能导览系统。本系统集成了AI大语言模型与3D数字人技术，为您提供沉浸式的智慧旅游体验。
          </p>
        </div>
      </div>

      {/* 角色介绍 */}
      <div style={{ padding: '0 20px', marginTop: -28, position: 'relative', zIndex: 2 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>AI导游角色</h3>
          <p style={{ fontSize: 13, color: '#9c948c', marginBottom: 16 }}>
            每位导游有独特的形象、声音和讲解风格
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {personaList.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '14px 10px', borderRadius: 12,
                  background: `${p.color}0D`,
                  border: `1px solid ${p.color}25`,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/tourist/chat?persona=${p.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tourist/chat?persona=${p.id}`) }}
              >
                {p.image && (
                  <img src={p.image} alt={p.name}
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', marginBottom: 6 }}
                  />
                )}
                <div style={{ fontSize: 15, fontWeight: 600, color: p.color }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#9c948c', marginTop: 2 }}>{p.role}</div>
                <div style={{ fontSize: 11, color: p.color, marginTop: 2, opacity: 0.7 }}>{p.style}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 功能特点 */}
      <div style={{ padding: '0 20px', marginTop: 20 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>功能特点</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {features.map((f) => (
            <div key={f.title} className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: '#9c948c', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 常见问题 */}
      <div style={{ padding: '0 20px', marginTop: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>常见问题</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, i) => (
            <details key={i} style={{
              background: '#fff', borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
              <summary style={{
                padding: '14px 16px', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: '#3d3630',
                listStyle: 'none', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                {faq.q}
                <span style={{ fontSize: 10, color: '#9c948c', marginLeft: 8, flexShrink: 0 }}>▼</span>
              </summary>
              <div style={{
                padding: '0 16px 14px', fontSize: 13, color: '#5c5348',
                lineHeight: 1.7,
              }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* 开始使用 */}
      <div style={{ padding: '0 20px', marginTop: 28, textAlign: 'center' }}>
        <button
          className="btn-primary"
          style={{ width: '100%', height: 52, fontSize: 17 }}
          onClick={() => navigate('/tourist/chat')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          开始使用AI导游
        </button>
        <button
          className="btn-secondary"
          style={{ width: '100%', height: 48, fontSize: 15, marginTop: 10 }}
          onClick={() => navigate('/tourist/digital-human')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
          </svg>
          查看3D数字人
        </button>
      </div>
    </div>
  )
}
