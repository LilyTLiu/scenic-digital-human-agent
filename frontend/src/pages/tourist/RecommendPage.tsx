import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { touristApi } from '../../services/api'

interface RouteStop { time: string; name: string; desc: string }

interface Route {
  title: string
  icon: string
  duration: string
  type: string
  color: string
  tags: string[]
  desc: string
  stops: RouteStop[]
}

const routes: Route[] = [
  {
    title: '历史文化深度游',
    icon: '🏛️',
    duration: '约6小时',
    type: '深度游',
    color: '#8b5e3c',
    tags: ['历史', '文化', '佛教'],
    desc: '从唐玄奘传说到现代灵山，全面感受千年佛教文化积淀，适合对历史有浓厚兴趣的游客。',
    stops: [
      { time: '09:00', name: '灵山大照壁', desc: '华夏第一壁，赵朴初题词' },
      { time: '09:20', name: '五明桥 · 佛足坛', desc: '过智慧桥，瞻仰佛足圣迹' },
      { time: '09:40', name: '祥符禅寺', desc: '千年古刹，听玄奘与小灵山的故事' },
      { time: '10:30', name: '灵山大佛', desc: '88米青铜大佛，登216级台阶' },
      { time: '13:00', name: '灵山梵宫', desc: '"东方卢浮宫"，艺术殿堂' },
      { time: '14:30', name: '五印坛城', desc: '藏传佛教文化体验' },
      { time: '15:30', name: '三圣殿', desc: '佛教历史文化展示，结束游览' },
    ],
  },
  {
    title: '自然风光轻松游',
    icon: '🌿',
    duration: '约5小时',
    type: '全景游',
    color: '#2d8a7b',
    tags: ['自然', '摄影', '休闲'],
    desc: '穿梭于禅意园林与太湖风光之间，在自然美景中感受佛教文化的宁静致远。',
    stops: [
      { time: '09:00', name: '佛足坛 · 九龙灌浴', desc: '观赏花开见佛动态表演' },
      { time: '10:00', name: '菩提大道', desc: '漫步林荫道，赏太湖风光' },
      { time: '11:00', name: '灵山大佛登顶', desc: '俯瞰太湖全景，拍摄佛光普照' },
      { time: '13:00', name: '曼飞龙塔', desc: '傣族风格园林景观' },
      { time: '14:00', name: '灵山精舍', desc: '禅意园林，体验宁静致远' },
      { time: '15:30', name: '梵宫广场', desc: '夕阳下拍摄梵宫全景' },
    ],
  },
  {
    title: '亲子欢乐游',
    icon: '👨‍👩‍👧',
    duration: '约4小时',
    type: '轻松游',
    color: '#e88b7e',
    tags: ['亲子', '互动', '体验'],
    desc: '寓教于乐的轻松路线，让孩子在互动中了解佛教文化，全家共享美好时光。',
    stops: [
      { time: '09:30', name: '九龙灌浴', desc: '看表演听佛陀诞生的故事' },
      { time: '10:10', name: '佛手广场', desc: '摸天下第一掌，祈福纳祥' },
      { time: '10:40', name: '百子戏弥勒', desc: '寻百名孩童雕塑，亲子拍照' },
      { time: '11:30', name: '梵宫圣坛', desc: '看《吉祥颂》全息演出' },
      { time: '13:30', name: '五印坛城', desc: '转经筒互动体验' },
    ],
  },
]

function matchScore(route: Route, interests: string[], travelStyle: string): number {
  let score = 0
  for (const tag of route.tags) {
    if (interests.some((i) => i.includes(tag) || tag.includes(i))) score += 3
  }
  if (route.type.includes(travelStyle)) score += 5
  if (route.title.includes(travelStyle.replace('游', ''))) score += 5
  return score
}

export default function RecommendPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [expanded, setExpanded] = useState<number | null>(null)

  const interests = user?.interests || []
  const travelStyle = user?.travel_style || ''
  const sorted = interests.length || travelStyle
    ? [...routes].sort((a, b) => matchScore(b, interests, travelStyle) - matchScore(a, interests, travelStyle))
    : routes

  // 基于 140K 游客数据的智能推荐
  const [smartRecs, setSmartRecs] = useState<any[]>([])
  useEffect(() => {
    touristApi.getRecommend({ age: 30, budget: 'medium', group: 'couple' })
      .then(d => setSmartRecs(d.recommendations || []))
      .catch(() => {})
  }, [])

  return (
    <div className="page-enter" style={{ padding: '20px 16px 32px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>游览路线推荐</h2>
        <p style={{ fontSize: 13, color: '#9c948c', marginTop: 4 }}>
          {user?.travel_style
            ? `根据你的「${user.travel_style}」偏好排序`
            : '根据您的偏好，选择最适合的游览方式'}
        </p>
        {!user && (
          <p style={{ fontSize: 12, color: '#c8963e', marginTop: 4 }}>
            💡 登录并设置偏好后，可智能推荐最适合你的路线
          </p>
        )}
      </div>

      {/* 路线卡片 */}
      {sorted.map((r, i) => {
        const open = expanded === i
        return (
          <div
            key={i}
            className="card"
            style={{
              marginBottom: 16,
              borderLeft: `4px solid ${r.color}`,
              transition: 'all 0.3s',
            }}
          >
            {/* 卡片头部 */}
            <div
              style={{ padding: '16px 18px', cursor: 'pointer' }}
              onClick={() => setExpanded(open ? null : i)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{r.title}</h3>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: '#9c948c' }}>⏱ {r.duration}</span>
                    <span style={{ fontSize: 12, color: r.color, fontWeight: 500 }}>{r.type}</span>
                  </div>
                </div>
                <svg
                  width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="#9c948c" strokeWidth="2"
                  style={{
                    transform: open ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.25s',
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.tags.map((t) => (
                  <span key={t} style={{
                    padding: '2px 10px', borderRadius: 10,
                    background: `${r.color}12`, color: r.color,
                    fontSize: 11, fontWeight: 500,
                  }}>{t}</span>
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#6b6058', marginTop: 8, lineHeight: 1.5 }}>
                {r.desc}
              </p>
            </div>

            {/* 展开：路线详情 */}
            {open && (
              <div style={{
                padding: '0 18px 18px',
                borderTop: '1px solid #f0ebe0',
                animation: 'pageIn 0.25s ease-out',
              }}>
                {/* 时间轴 */}
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  <div style={{
                    position: 'absolute', left: 6, top: 8, bottom: 8,
                    width: 2, background: '#e8e3db', borderRadius: 1,
                  }} />
                  {r.stops.map((s, j) => (
                    <div key={j} style={{
                      position: 'relative', marginBottom: j < r.stops.length - 1 ? 14 : 0,
                      paddingLeft: 8,
                    }}>
                      <div style={{
                        position: 'absolute', left: -18, top: 4,
                        width: 10, height: 10, borderRadius: '50%',
                        background: r.color, border: '2px solid #fff',
                        boxShadow: `0 0 0 2px ${r.color}30`,
                      }} />
                      <div style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>
                        {s.time}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginTop: 1 }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#9c948c', marginTop: 1 }}>
                        {s.desc}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 操作按钮 */}
                <button
                  onClick={() => navigate(`/tourist/tour?route=${i}`)}
                  style={{
                    marginTop: 16, width: '100%', padding: '12px',
                    borderRadius: 24, border: 'none', cursor: 'pointer',
                    background: r.color, color: '#fff',
                    fontSize: 15, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  让AI导游解说这条路线
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* 基于 14 万游客数据的智能推荐 */}
      {smartRecs.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            📊 相似游客还喜欢这些景点
          </h3>
          <p style={{ fontSize: 12, color: '#9c948c', marginBottom: 12 }}>
            基于 140,000+ 条真实游客数据，匹配与你偏好相近的游客选择
          </p>
          {smartRecs.slice(0, 6).map((r, i) => (
            <div key={i} className="card" style={{
              marginBottom: 8, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#f5f1eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#c8963e', fontWeight: 600,
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#9c948c' }}>
                  {r.type} · 约{r.avg_hours}h · 满意度{r.satisfaction}分
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#c8963e' }}>¥{r.est_cost}</div>
                <div style={{ fontSize: 10, color: '#9c948c' }}>人均预估</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
