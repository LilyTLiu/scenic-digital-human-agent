import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'

interface ChatRecord {
  id: number
  session_id: string
  scenic_spot: string
  user_input: string
  ai_reply: string
  created_at: string
}

interface FeedbackItem {
  id: number
  rating: number
  question: string
  created_at: string
}

export default function ReportPage() {
  const [records, setRecords] = useState<ChatRecord[]>([])
  const [fbStats, setFbStats] = useState({
    total: 0,
    likes: 0,
    dislikes: 0,
    rate: 0,
    recent: [] as FeedbackItem[],
  })
  const [stats, setStats] = useState({ totalChats: 0, totalSessions: 0, todayChats: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getFeedbackStats().catch(() => null),
      adminApi.getChatRecords({ size: 30 }).catch(() => null),
    ])
      .then(([dash, fb, chatData]) => {
        setStats({
          totalChats: dash.total_chats || 0,
          totalSessions: dash.total_sessions || 0,
          todayChats: dash.today_chats || 0,
        })
        if (fb) {
          setFbStats({
            total: fb.total || 0,
            likes: fb.likes || 0,
            dislikes: fb.dislikes || 0,
            rate: fb.rate || 0,
            recent: fb.recent || [],
          })
        }
        if (chatData) {
          setRecords(chatData.items || [])
        }
      })
      .catch(() => setError('数据加载失败，请确认后端已启动'))
      .finally(() => setLoading(false))
  }, [])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <span>加载报表数据中…</span>
      </div>
    )
  }

  /* ── Error ── */
  if (error) {
    return <div className="admin-error">{error}</div>
  }

  return (
    <div>
      <h2 className="admin-page-title">游客反馈报告</h2>
      <p className="admin-page-subtitle">对话与反馈数据概览</p>

      {/* ── Stat Cards ── */}
      <div className="admin-stat-row">
        <div className="admin-stat-card">
          <p className="admin-stat-label">累计对话</p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="admin-stat-accent" style={{ backgroundColor: '#c8963e' }} />
            <span className="admin-stat-value">{stats.totalChats.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <p className="admin-stat-label">点赞</p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="admin-stat-accent" style={{ backgroundColor: 'var(--admin-green)' }} />
            <span className="admin-stat-value" style={{ color: 'var(--admin-green)' }}>
              {fbStats.likes.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <p className="admin-stat-label">踩</p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="admin-stat-accent" style={{ backgroundColor: 'var(--admin-red)' }} />
            <span className="admin-stat-value" style={{ color: 'var(--admin-red)' }}>
              {fbStats.dislikes.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <p className="admin-stat-label">好评率</p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="admin-stat-accent" style={{ backgroundColor: 'var(--admin-blue)' }} />
            <span className="admin-stat-value" style={{ color: 'var(--admin-blue)' }}>
              {fbStats.rate}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Feedback Table ── */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-title">游客反馈评价</div>
        </div>
        {fbStats.recent.length === 0 ? (
          <div className="admin-empty">暂无反馈，游客使用对话时点击赞/踩后自动记录</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>评价</th>
                  <th>问题</th>
                </tr>
              </thead>
              <tbody>
                {fbStats.recent.map((item) => (
                  <tr key={item.id}>
                    <td style={{ width: 160, whiteSpace: 'nowrap' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td style={{ width: 80 }}>
                      {item.rating === 1 ? (
                        <span className="admin-tag admin-tag--green">赞</span>
                      ) : (
                        <span className="admin-tag admin-tag--red">踩</span>
                      )}
                    </td>
                    <td>{item.question || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Chat Records Table ── */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-title">最近对话记录</div>
        </div>
        {records.length === 0 ? (
          <div className="admin-empty">暂无对话记录</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>游客提问</th>
                  <th>AI 回复</th>
                  <th>景区</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ width: 160, whiteSpace: 'nowrap' }}>
                      {rec.created_at ? new Date(rec.created_at).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.user_input || '-'}
                    </td>
                    <td style={{ maxWidth: 250 }}>
                      {(rec.ai_reply || '').slice(0, 80)}
                      {(rec.ai_reply || '').length > 80 ? '...' : ''}
                    </td>
                    <td style={{ width: 100 }}>
                      {rec.scenic_spot ? (
                        <span className="admin-tag admin-tag--teal">{rec.scenic_spot}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
