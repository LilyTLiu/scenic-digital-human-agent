import { useState, useEffect } from 'react'
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

const preferenceQuestions: Record<string, string[]> = {
  '佛教文化': ['灵山大佛的建造背景？', '祥符禅寺千年历史？', '五印坛城有什么特色？'],
  '建筑艺术': ['梵宫的建筑风格有何独特？', '灵山大照壁的雕刻细节？', '九龙灌浴雕塑的设计理念？'],
  '历史典故': ['唐玄奢与小灵山的故事？', '灵山胜境的发展历程？', '赵朴初与灵山的溊源？'],
  '自然风光': ['灵山太湖最佳观景点？', '哪个季节来灵山最美？', '蒲提大道有什么植物景观？'],
  '亲子互动': ['带孩子怎么玩灵山？', '九龙灌浴几点表演？', '灵山有哪些互动体验项目？'],
  '禅修体验': ['灵山精舍有禅修课程吗？', '如何预约禅修体验？', '灵山有哪些适合冥想的地方？'],
  '摄影打卡': ['灵山最佳拍照点在哪里？', '梵宫哪个角度拍最好看？', '什么时间拍大佛光线最好？'],
  '美食素宅': ['灵山素食餐厅推荐？', '梵宫素宅有什么特色菜？', '灵山周边有什么美食？'],
}

function getPersonalizedQuestions(interests: string[]): string[] {
  const qs: string[] = []
  for (const tag of interests) {
    const matched = preferenceQuestions[tag]
    if (matched) qs.push(...matched)
  }
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
  const [weather, setWeather] = useState<{temp:string;weather:string;wind:string} | null>(null)

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=31.42&longitude=120.10&current=temperature_2m,weather_code,wind_speed_10m')
      .then(r => r.json())
      .then(d => {
        if (d.current) {
          const code = d.current.weather_code
          const weatherMap: Record<number, string> = {
            0: '晴天', 1: '晴', 2: '多云', 3: '阴天',
            45: '雾', 48: '雾凇',
            51: '小雨', 53: '小雨', 55: '中雨',
            61: '小雨', 63: '中雨', 65: '大雨',
            71: '小雪', 73: '中雪', 75: '大雪',
            80: '阵雨', 81: '阵雨', 82: '暴雨',
            95: '雷暴', 96: '雷暴', 99: '雷暴',
          }
          setWeather({
            temp: d.current.temperature_2m.toFixed(0),
            weather: weatherMap[code] || '未知',
            wind: d.current.wind_speed_10m.toFixed(0),
          })
        }
      })
      .catch(() => {})
  }, [])

  const quickQuestions = user?.interests?.length
    ? getPersonalizedQuestions(user.interests)
    : defaultQuestions

  const handleQuickAsk = (q: string) => {
    navigate(`/tourist/chat?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="page-enter tourist-home" style={{ padding: '0 0 32px', position: 'relative' }}>

      {/* === 顶部：大图 + 悬浮信息卡片 === */}
      <div style={{ margin: '0 20px 0', position: 'relative', gridColumn: '1 / -1', paddingBottom: 50 }}>
        <div style={{ width: '100%', height: 280, background: 'url(/首页模块底图.jpg) center / cover no-repeat', borderRadius: 16, overflow: 'hidden', position: 'relative', cursor: 'pointer', animation: 'zenFadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) both', transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease', boxShadow: '0 4px 20px rgba(184,166,135,0.08)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(44,41,38,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(184,166,135,0.08)' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(74,60,49,0.42) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', padding: '22px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(251,249,245,0.20)', color: '#fbf9f5', backdropFilter: 'blur(6px)', border: '1px solid rgba(251,249,245,0.25)' }}>国家5A级景区</span>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(251,249,245,0.20)', color: '#fbf9f5', backdropFilter: 'blur(6px)', border: '1px solid rgba(251,249,245,0.25)' }}>世界佛教论坛永久会址</span>
              </div>
              <div>
                {user ? (
                  <button onClick={() => setProfileOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 4px', borderRadius: 16, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #c8963e, #e88b7e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{user.nickname?.[0] || '👤'}</div>
                    <span style={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname}</span>
                  </button>
                ) : (
                  <button onClick={() => setLoginOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg> 登录
                  </button>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <h1 style={{ fontFamily: "'Noto Serif SC', 'Source Han Serif SC', serif", fontSize: 30, color: '#fbf9f5', fontWeight: 700, marginBottom: 6, textShadow: '0 2px 8px rgba(0,0,0,0.30)', letterSpacing: '0.03em' }}>步入灵山胜境，静听梵音澄心</h1>
              <p style={{ fontSize: 14, color: 'rgba(251,249,245,0.80)', lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.20)' }}>从梵宫圣境到九龙灌浴，为你开启一场洗涤心灵的智慧行游。</p>
            </div>
          </div>
        </div>

        {/* 压线悬浮四卡片 */}
        <div style={{ position: 'absolute', bottom: 0, left: 24, right: 24, zIndex: 10, display: 'flex', gap: 14 }}>
          {[
            { value: '15+', label: '核心胜境' },
            { value: weather ? `${weather.temp}°C` : '--°C', label: '今日气温' },
            { value: '4-6', label: '游览时长', unit: 'h' },
            { value: '禅意', label: '人文风物', unit: '美学' },
          ].map((card, i) => (
            <div key={i} style={{ flex: 1, height: 80, background: '#fbf9f5', borderRadius: 14, border: '1px solid rgba(184,166,135,0.28)', boxShadow: '0 10px 25px rgba(184,166,135,0.18)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 14, paddingLeft: 18, cursor: 'pointer', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(168,135,84,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(184,166,135,0.18)' }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: '#a88754', fontFamily: 'system-ui, sans-serif', lineHeight: 1.2 }}>{card.value}{card.unit && <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2, color: '#a88754' }}>{card.unit}</span>}</div>
              <div style={{ fontSize: 11, color: '#8c7c6e', marginTop: 3, fontFamily: "'Noto Serif SC', serif", letterSpacing: '0.05em' }}>{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* === AI数字导游 + 地图导览（6:4） === */}
      <div style={{ margin: '20px 20px 0', display: 'flex', gap: 14, position: 'relative', zIndex: 3, gridColumn: '1 / -1' }}>
        <div style={{ flex: 6, display: 'flex', alignItems: 'stretch' }}>
          <div className="card" style={{ background: 'rgba(255,252,247,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', padding: '18px', display: 'flex', gap: 16, alignItems: 'center', width: '100%', height: '100%' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="guofeng-title" style={{ fontSize: 18, color: '#c8963e', marginBottom: 3 }}>我在灵山胜境等你</h2>
              <p style={{ fontSize: 12, color: '#5c5348', lineHeight: 1.6, marginBottom: 12 }}>我是导游小文，游览路线、灵山故事都可以问我。</p>
              <button onClick={() => navigate('/tourist/chat')} style={{ padding: '7px 22px', borderRadius: 20, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #c8963e, #a0722a)', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(200,150,62,0.28)', fontFamily: 'inherit' }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)' }}
              >💬 与我对话</button>
            </div>
            <div style={{ width: 90, height: 120, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(200,150,62,0.08), rgba(180,130,70,0.04))' }}>
              <img src="/avatars/guide-xiaowen.png" alt="导游小文" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
        <div style={{ flex: 4, display: 'flex', alignItems: 'stretch' }}>
          <div className="card" style={{ background: 'rgba(255,252,247,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', padding: '18px', cursor: 'pointer', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease', width: '100%', height: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(45,138,123,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            onClick={() => navigate('/tourist/tour')}
          >
            <div style={{ fontSize: 26, marginBottom: 4 }}>🗺️</div>
            <h2 className="guofeng-title" style={{ fontSize: 16, color: '#c8963e', marginBottom: 3 }}>游园导览地图</h2>
            <p style={{ fontSize: 12, color: '#5c5348', lineHeight: 1.6, marginBottom: 10 }}>景点定位、路线规划，一图在手游灵山。</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.25s', padding: '7px 22px', borderRadius: 20, background: 'linear-gradient(135deg, #c8963e, #a0722a)', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(200,150,62,0.28)' }} onMouseEnter={e => { (e.target as HTMLDivElement).style.transform = 'translateY(-1px)' }} onMouseLeave={e => { (e.target as HTMLDivElement).style.transform = 'translateY(0)' }}>立即探索 <span style={{ fontSize: 14 }}>→</span></div>
          </div>
        </div>
      </div>

      {/* === 开放时间 + 门票 + 活动通知（三栏滚动） === */}
      <div style={{ margin: '20px 20px 0', display: 'flex', gap: 14, position: 'relative', zIndex: 3, gridColumn: '1 / -1' }}>
        {/* 开放时间通知 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ background: 'rgba(255,252,247,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', padding: '14px 16px', overflow: 'hidden', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>🕐</span>
              <span className="guofeng-title" style={{ fontSize: 14, color: '#c8963e' }}>开放时间</span>
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'inline-block', animation: 'homeScrollRight 15s linear infinite', fontSize: 12, color: '#5c5348' }}>
                灵山胜境 8:00—17:30 · 祥符禅寺 8:30—16:30 · 梵宫 9:00—17:00（冬季16:30）· 灵山精舍 9:00—16:30
              </div>
            </div>
          </div>
        </div>
        {/* 门票信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ background: 'rgba(255,252,247,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', padding: '14px 16px', overflow: 'hidden', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>🎫</span>
              <span className="guofeng-title" style={{ fontSize: 14, color: '#c8963e' }}>门票信息</span>
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'inline-block', animation: 'homeScrollRight 18s linear infinite', fontSize: 12, color: '#5c5348' }}>
                成人票 ¥195 · 儿童/老人半价 ¥97.5 · 学生票 ¥120 · 索道票单程 ¥40
              </div>
            </div>
          </div>
        </div>
        {/* 活动/表演通知 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ background: 'rgba(255,252,247,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', padding: '14px 16px', overflow: 'hidden', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>🎭</span>
              <span className="guofeng-title" style={{ fontSize: 14, color: '#c8963e' }}>活动 · 表演</span>
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'inline-block', animation: 'homeScrollRight 20s linear infinite', fontSize: 12, color: '#5c5348' }}>
                九龙灌浴 10:00 / 11:30 / 13:30 / 15:00 · 灵山吉祥颂 10:35 / 11:30 / 14:00 / 16:00 · 拈花湾《禅行》夜游 18:30
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 服务入口五卡片 === */}
      <div style={{ margin: '20px 20px 0', display: 'flex', gap: 14, position: 'relative', zIndex: 3, gridColumn: '1 / -1' }}>
        {[
          { icon: '📸', name: '打卡点推荐', color: '#c8963e', onClick: () => navigate('/tourist/recommend') },
          { icon: '🔍', name: '失物招领', color: '#2d8a7b', onClick: () => navigate('/tourist/chat') },
          { icon: '✨', name: '智能路线定制', color: '#8b5e3c', onClick: () => navigate('/tourist/plan') },
          { icon: '📝', name: '投诉建议', color: '#c44e3d', onClick: () => navigate('/tourist/chat') },
          { icon: '🆘', name: '紧急求助', color: '#e85d3a', onClick: () => navigate('/tourist/chat') },
        ].map((card, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={card.onClick}>
            <div className="card" style={{
              background: 'rgba(255,252,247,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              padding: '14px 10px', textAlign: 'center', height: '100%', width: '100%',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(184,166,135,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{card.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: card.color, fontFamily: "'Noto Serif SC', serif" }}>{card.name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* === 热门景点 === */}
      <div style={{ margin: '20px 20px 0', position: 'relative', zIndex: 3, gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="guofeng-title" style={{ fontSize: 16, color: '#3d3630' }}>热门景点</h2>
          <div
            onClick={() => navigate('/tourist/recommend')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 16px', borderRadius: 16, background: 'rgba(200,150,62,0.10)', color: '#c8963e', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { (e.target as HTMLDivElement).style.background = 'rgba(200,150,62,0.20)' }}
            onMouseLeave={e => { (e.target as HTMLDivElement).style.background = 'rgba(200,150,62,0.10)' }}
          >
            全部 →
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { id: 'lingshandafo', name: '灵山大佛', subtitle: '88米青铜立佛·世界之最', img: '/images/spots/lingshandafo.jpg', color: '#9b8465' },
            { id: 'jiulongguanyu', name: '九龙灌浴', subtitle: '花开见佛·动态音乐群雕', img: '/images/spots/jiulongguanyu.jpg', color: '#4a9ec8' },
            { id: 'fansong', name: '灵山梵宫', subtitle: '东方卢浮宫·艺术殿堂', img: '/images/spots/fansong.jpg', color: '#d4852a' },
            { id: 'wuyintancheng', name: '五印坛城', subtitle: '藏传佛教·雪域文化', img: '/images/spots/wuyintancheng.jpg', color: '#c44e3d' },
          ].map((spot, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate('/tourist/recommend')}>
              <div className="card" style={{
                background: 'rgba(255,252,247,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                overflow: 'hidden', width: '100%', height: '100%',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(184,166,135,0.20)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ height: 100, overflow: 'hidden' }}>
                  <img src={spot.img} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: spot.color, fontFamily: "'Noto Serif SC', serif" }}>{spot.name}</div>
                  <div style={{ fontSize: 10, color: '#9c948c', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.subtitle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === 路线推荐 === */}
      {(() => {
        const allRoutes = [
          { title: '历史文化深度游', icon: '🏛️', img: '/spots/linshandafo.jpg', color: '#8b5e3c', desc: '大照壁→大佛→梵宫，深度感受佛教文化', routeIdx: 0 },
          { title: '自然风光轻松游', icon: '🌿', img: '/spots/wuyintancheng.jpg', color: '#2d8a7b', desc: '九龙灌浴→大佛→精舍，轻松自在赏景', routeIdx: 1 },
          { title: '亲子欢乐游', icon: '👨‍👩‍👧', img: '/spots/wumingqiao.png', color: '#e88b7e', desc: '表演+佛手广场+坛城转经，寓教于乐', routeIdx: 2 },
          { title: '祈福纳祥游', icon: '🙏', img: '/spots/xiangfuchansi.jpg', color: '#c8963e', desc: '照壁祈福→上香→抱佛脚→转经筒', routeIdx: 3 },
          { title: '打卡拍照游', icon: '📸', img: '/spots/manfeilongta.png', color: '#9b59b6', desc: '大佛全景+梵宫穹顶+白塔人像', routeIdx: 4 },
          { title: '禅意静心游', icon: '🧘', img: '/spots/linshanjingshe.jpg', color: '#1abc9c', desc: '精舍抄经+禅寺听钟+坛城登高', routeIdx: 5 },
        ]
        // 未登录/无偏好 → 前3条；已登录按偏好匹配
        const interests = user?.interests || []
        const recommended = interests.length > 0
          ? allRoutes.filter(r => r.title.includes(interests[0]) || r.desc.includes(interests[0]) || interests.some(i => r.title.includes(i) || r.desc.includes(i))).concat(allRoutes).slice(0, 3)
          : allRoutes.slice(0, 3)
        return (
          <div style={{ margin: '20px 20px 0', position: 'relative', zIndex: 3, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 className="guofeng-title" style={{ fontSize: 16, color: '#3d3630' }}>路线推荐</h2>
              <div
                onClick={() => navigate('/tourist/tour')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 16px', borderRadius: 16, background: 'rgba(200,150,62,0.10)', color: '#c8963e', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s' }}
                onMouseEnter={e => { (e.target as HTMLDivElement).style.background = 'rgba(200,150,62,0.20)' }}
                onMouseLeave={e => { (e.target as HTMLDivElement).style.background = 'rgba(200,150,62,0.10)' }}
              >
                全部 →
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {recommended.map((route, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/tourist/tour?route=${route.routeIdx}`)}>
                  <div className="card" style={{
                    background: 'rgba(255,252,247,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                    overflow: 'hidden', width: '100%', height: '100%',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(184,166,135,0.20)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ height: 100, overflow: 'hidden' }}>
                      <img src={route.img} alt={route.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: route.color, fontFamily: "'Noto Serif SC', serif" }}>{route.icon} {route.title}</div>
                      <div style={{ fontSize: 10, color: '#9c948c', marginTop: 3, lineHeight: 1.4 }}>{route.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* === 快捷提问 === */}
      <div className="tourist-home-questions card" style={{ padding: '20px', margin: '20px 20px 0', gridColumn: '1 / -1' }}>
        <h3 className="guofeng-title" style={{ fontSize: 16, marginBottom: 4 }}>
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


      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}
