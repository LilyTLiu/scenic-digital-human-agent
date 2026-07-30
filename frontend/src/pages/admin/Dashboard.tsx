import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { adminApi, reviewApi } from '../../services/api'
import { useNavigate } from 'react-router-dom'

interface DashboardData {
  total_chats: number; total_knowledge: number; today_chats: number
  total_sessions: number; hot_keywords: string[]
  daily_trend: { date: string; count: number }[]; hourly_trend: { hour: string; count: number }[]
  spot_breakdown?: { spot_id: string; chat_count: number; kb_count: number }[]
}
interface ReviewStats {
  spots: { spot_id: string; count: number; avg_rating: number }[]
  total_reviews: number; total_checkins: number; avg_rating_all: number
}
interface StatCardSpec { key: string; label: string; value: number | string; accentColor: string }

const SPOT_NAMES: Record<string, string> = {
  lingshandafo: '灵山大佛', jiulongguanyu: '九龙灌浴', fansong: '灵山梵宫',
  wuyintancheng: '五印坛城', xiangfuchansi: '祥符禅寺', zhaobi: '灵山大照壁',
  wumingqiao: '五明桥', fanshouguangchang: '佛手广场', manfeilongta: '曼飞龙塔',
  lingshanjingshe: '灵山精舍', nianhuawan: '拈花湾禅意小镇',
}
const RATING_COLORS = ['#e0d8cc', '#e8c97a', '#c8963e', '#a0722a']
const SPOT_BAR_COLORS = ['#c8963e','#2d8a7b','#4a9ec8','#9b8465','#5d8a5e','#a09080',
  '#7a9e7e','#8b7355','#a09878','#6b8d6e','#b0845a']

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [revStats, setRevStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard(),
      reviewApi.stats().catch(() => null),
    ])
      .then(([d, r]) => { setData(d); setRevStats(r) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" /><span>加载数据中…</span>
      </div>
    )
  }
  if (error || !data) {
    return <div className="admin-error" style={{ padding: 48 }}>数据加载失败，请确认后端已启动</div>
  }

  /* Quick actions */
  const quickActions = [
    { label: '新增知识', icon: '📝', path: '/admin/knowledge' },
    { label: '景区管理', icon: '🌐', path: '/admin/scenic-spots' },
    { label: '管理评价', icon: '⭐', path: '/admin/reviews' },
    { label: '查看打卡', icon: '📷', path: '/admin/checkins' },
  ]

  /* Stat cards */
  const statCards: StatCardSpec[] = [
    { key: 'today_chats', label: '今日对话', value: data.today_chats.toLocaleString(), accentColor: '#c8963e' },
    { key: 'total_chats', label: '累计对话', value: data.total_chats.toLocaleString(), accentColor: '#2d8a7b' },
    { key: 'total_reviews', label: '游客评价', value: revStats?.total_reviews?.toLocaleString() ?? '—', accentColor: '#4a9ec8' },
    { key: 'total_checkins', label: '游客打卡', value: revStats?.total_checkins?.toLocaleString() ?? '—', accentColor: '#9b8465' },
    { key: 'avg_rating', label: '评价均分', value: revStats?.avg_rating_all ? `${revStats.avg_rating_all} / 5` : '—', accentColor: '#5d8a5e' },
    { key: 'total_knowledge', label: '知识条目', value: data.total_knowledge.toLocaleString(), accentColor: '#6b8d6e' },
  ]

  /* Per-spot bar chart data */
  const spotChartData = (revStats?.spots ?? []).map(s => ({
    name: SPOT_NAMES[s.spot_id] || s.spot_id,
    reviews: s.count,
    rating: s.avg_rating,
    fill: SPOT_BAR_COLORS[Object.keys(SPOT_NAMES).indexOf(s.spot_id) % SPOT_BAR_COLORS.length],
  })).sort((a, b) => b.reviews - a.reviews)

  /* Per-spot rating data for pie */
  const ratingPieData = (revStats?.spots ?? [])
    .filter(s => s.count > 0)
    .map(s => ({
      name: SPOT_NAMES[s.spot_id] || s.spot_id,
      value: s.avg_rating,
      count: s.count,
    }))
    .sort((a, b) => b.value - a.value)

  /* Hot keywords */
  const keywordData = data.hot_keywords.filter(Boolean).map((k, i) => ({ rank: i + 1, text: k }))

  return (
    <div>
      {/* Page title + quick actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 className="admin-page-title" style={{ marginBottom: 4 }}>数据大屏</h2>
          <p className="admin-page-subtitle" style={{ marginBottom: 0 }}>系统运行概览 · 游客互动分析 · 内容运营数据</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {quickActions.map(a => (
            <button
              key={a.path}
              className="admin-btn admin-btn--secondary admin-btn--sm"
              onClick={() => navigate(a.path)}
              title={a.label}
            >
              <span style={{ fontSize: 14 }}>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-stat-row">
        {statCards.map(card => (
          <div className="admin-stat-card" key={card.key}>
            <p className="admin-stat-label">{card.label}</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="admin-stat-accent" style={{ backgroundColor: card.accentColor, flexShrink: 0 }} />
              <span className="admin-stat-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Daily trend + Hourly trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title">近 7 天对话趋势</div>
          </div>
          <div className="admin-panel-body">
            <div className="admin-chart">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.daily_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d8cc" />
                  <XAxis dataKey="date" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e0d8cc' }}
                    formatter={(v) => [`${v} 次`, '对话量']} />
                  <Line type="monotone" dataKey="count" stroke="#c8963e" strokeWidth={2}
                    dot={{ r: 4, fill: '#c8963e' }} activeDot={{ r: 6 }} name="对话量" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title">今日时段分布 (8:00-21:00)</div>
          </div>
          <div className="admin-panel-body">
            <div className="admin-chart">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.hourly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d8cc" />
                  <XAxis dataKey="hour" fontSize={11} angle={-45} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e0d8cc' }}
                    formatter={(v) => [`${v} 次`, '对话量']} />
                  <Bar dataKey="count" fill="#5d7a8e" radius={[4, 4, 0, 0]} name="对话量" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Spot review counts + Rating overview */}
      {spotChartData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Spot review count bar chart */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">景点热度排行</div>
              <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                按评价数量排序
              </span>
            </div>
            <div className="admin-panel-body">
              <div className="admin-chart">
                <ResponsiveContainer width="100%" height={spotChartData.length * 36 + 20}>
                  <BarChart data={spotChartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0d8cc" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} fontSize={11} />
                    <YAxis dataKey="name" type="category" fontSize={12} width={70} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e0d8cc' }}
                      formatter={(v, _name, props) => [`${v} 条评价`, `${props.payload.rating} 分`]} />
                    <Bar dataKey="reviews" radius={[0, 4, 4, 0]} name="评价数">
                      {spotChartData.map((entry, idx) => (
                        <Cell key={idx} fill={SPOT_BAR_COLORS[idx % SPOT_BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Rating overview */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">满意度概览</div>
            </div>
            <div className="admin-panel-body">
              {ratingPieData.length > 0 ? (
                <div className="admin-chart">
                  <ResponsiveContainer width="100%" height={spotChartData.length * 36 + 20}>
                    <BarChart data={ratingPieData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0d8cc" horizontal={false} />
                      <XAxis type="number" domain={[3, 5]} fontSize={11} tickFormatter={v => `${v}分`} />
                      <YAxis dataKey="name" type="category" fontSize={12} width={70} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e0d8cc' }}
                        formatter={(v, _name, props) => [`${v} / 5`, `${props.payload.count} 条评价`]} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} name="均分" fill="#c8963e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="admin-empty" style={{ padding: 24 }}>暂无评价数据</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Hot keywords + empty fallback */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-title">热门问题排行</div>
        </div>
        {keywordData.length > 0 ? (
          <div className="admin-table-wrap" style={{ padding: '0 20px 20px' }}>
            <table className="admin-table">
              <thead>
                <tr><th>排名</th><th>热门问题</th></tr>
              </thead>
              <tbody>
                {keywordData.map(item => (
                  <tr key={item.rank}>
                    <td style={{ width: 60, textAlign: 'center' as const }}>
                      {item.rank <= 3 ? (
                        <span className={`admin-tag ${item.rank === 1 ? 'admin-tag--gold' : item.rank === 2 ? 'admin-tag--teal' : 'admin-tag--blue'}`}>
                          {item.rank}
                        </span>
                      ) : item.rank}
                    </td>
                    <td>{item.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">暂无数据 — 游客开始提问后自动统计热门问题</div>
        )}
      </div>

      {/* ── Smart Insights + Content Health ── */}
      <SmartInsights
        spotData={data.spot_breakdown ?? []}
        reviewStats={revStats}
        totalChats={data.total_chats}
        totalKnowledge={data.total_knowledge}
      />
      <ContentHealthMatrix
        spotData={data.spot_breakdown ?? []}
        reviewStats={revStats}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Smart Insights — 自动生成可操作的数据洞察
   ══════════════════════════════════════════════════════════════ */
function SmartInsights({ spotData, reviewStats, totalChats, totalKnowledge }: {
  spotData: { spot_id: string; chat_count: number; kb_count: number }[]
  reviewStats: ReviewStats | null
  totalChats: number; totalKnowledge: number
}) {
  const insights: { type: 'warning' | 'positive' | 'info'; icon: string; text: string }[] = []

  /* 1. Content gap detection */
  spotData.forEach(s => {
    const name = SPOT_NAMES[s.spot_id] || s.spot_id
    if (s.chat_count >= 3 && s.kb_count === 0) {
      insights.push({ type: 'warning', icon: '⚠️', text: `${name}：有 ${s.chat_count} 次对话但 0 条知识条目，建议立即补充` })
    } else if (s.chat_count > 0 && s.kb_count > 0 && s.chat_count / s.kb_count > 10) {
      insights.push({ type: 'warning', icon: '📉', text: `${name}：${s.chat_count} 次对话仅 ${s.kb_count} 条知识覆盖，覆盖率不足` })
    }
  })

  /* 2. High performers */
  if (reviewStats?.spots) {
    const top = [...reviewStats.spots].filter(s => s.count >= 3).sort((a, b) => b.avg_rating - a.avg_rating)
    if (top.length > 0) {
      const name = SPOT_NAMES[top[0].spot_id] || top[0].spot_id
      insights.push({ type: 'positive', icon: '⭐', text: `${name}：评价均分最高 (${top[0].avg_rating}/5，${top[0].count} 条评价)` })
    }
    if (reviewStats.total_reviews > 0 && reviewStats.avg_rating_all >= 4.5) {
      insights.push({ type: 'positive', icon: '🙌', text: `整体满意度优秀：${reviewStats.avg_rating_all}/5（${reviewStats.total_reviews} 条评价）` })
    }
  }

  /* 3. Rising stars */
  if (reviewStats?.spots) {
    const mostActive = [...reviewStats.spots].sort((a, b) => b.count - a.count)
    if (mostActive.length > 0) {
      const name = SPOT_NAMES[mostActive[0].spot_id] || mostActive[0].spot_id
      insights.push({ type: 'info', icon: '🔥', text: `${name}：评价数最多 (${mostActive[0].count} 条)，游客互动最活跃` })
    }
  }

  /* 4. Knowledge freshness hint */
  if (totalKnowledge > 0 && totalChats > 0) {
    const ratio = (totalKnowledge / Math.max(totalChats, 1)).toFixed(1)
    insights.push({ type: 'info', icon: '📊', text: `全局知识覆盖率：${totalKnowledge} 条目 / ${totalChats} 次对话（${ratio} 条/次）` })
  }

  /* Limit to 6 */
  const display = insights.slice(0, 6)

  if (display.length === 0) return null

  return (
    <div className="admin-panel" style={{ marginBottom: 24 }}>
      <div className="admin-panel-header">
        <div className="admin-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--admin-gold)" strokeWidth="2.2" strokeLinecap="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          智能洞察
        </div>
        <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>基于数据自动生成</span>
      </div>
      <div className="admin-panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {display.map((ins, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5,
              padding: '10px 14px', borderRadius: 8,
              background: ins.type === 'warning' ? 'rgba(232,139,126,0.06)' :
                         ins.type === 'positive' ? 'rgba(93,138,94,0.06)' :
                         'rgba(155,132,101,0.05)',
              border: `1px solid ${ins.type === 'warning' ? 'rgba(232,139,126,0.15)' :
                      ins.type === 'positive' ? 'rgba(93,138,94,0.15)' :
                      'rgba(155,132,101,0.10)'}`,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
              <span style={{ color: 'var(--admin-text)', lineHeight: 1.55 }}>{ins.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Content Health Matrix — 各景点内容健康度一览
   ══════════════════════════════════════════════════════════════ */
function ContentHealthMatrix({ spotData, reviewStats }: {
  spotData: { spot_id: string; chat_count: number; kb_count: number }[]
  reviewStats: ReviewStats | null
}) {
  if (spotData.length === 0) return null

  /* Compute health score per spot (0-100) */
  const computeHealth = (spotId: string, chat: number, kb: number): { score: number; label: string; color: string } => {
    const revSpot = reviewStats?.spots?.find(s => s.spot_id === spotId)
    let score = 50 // baseline

    /* Knowledge coverage (40% weight) */
    if (chat > 0 && kb > 0) {
      const ratio = Math.min(kb / chat, 2)
      score += ratio * 20
    } else if (kb > 0) {
      score += 15
    } else if (chat > 0) {
      score -= 25
    }

    /* Review sentiment (35% weight) */
    if (revSpot && revSpot.count >= 2) {
      score += (revSpot.avg_rating - 3.5) * 14
    }

    /* Activity bonus (25% weight) */
    if (revSpot && revSpot.count >= 5) score += 10
    if (chat >= 5) score += 5

    score = Math.max(0, Math.min(100, Math.round(score)))

    if (score >= 80) return { score, label: '健康', color: '#5d8a5e' }
    if (score >= 55) return { score, label: '一般', color: '#c8963e' }
    return { score, label: '需关注', color: '#e88b7e' }
  }

  const matrix = spotData.map(s => ({
    spot_id: s.spot_id,
    name: SPOT_NAMES[s.spot_id] || s.spot_id,
    chat_count: s.chat_count,
    kb_count: s.kb_count,
    ...computeHealth(s.spot_id, s.chat_count, s.kb_count),
  })).sort((a, b) => a.score - b.score)

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div className="admin-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--admin-teal)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 20V10M18 20V4M6 20v-6" />
          </svg>
          内容健康度
        </div>
        <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>
          综合知识覆盖 · 评价口碑 · 活跃度
        </span>
      </div>
      <div className="admin-panel-body">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>景点</th>
                <th>对话量</th>
                <th>知识条目</th>
                <th>覆盖比</th>
                <th>健康分</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map(item => (
                <tr key={item.spot_id}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.chat_count || '—'}</td>
                  <td>{item.kb_count || '—'}</td>
                  <td>{item.chat_count > 0 ? `${item.kb_count}/${item.chat_count}` : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 100, height: 6, borderRadius: 3, background: 'var(--admin-bg)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${item.score}%`, height: '100%', borderRadius: 3,
                          background: item.color, transition: 'width 0.5s',
                        }} />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: item.color }}>
                        {item.score}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-tag" style={{
                      background: `${item.color}14`, color: item.color,
                      borderColor: `${item.color}28`,
                    }}>
                      {item.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
