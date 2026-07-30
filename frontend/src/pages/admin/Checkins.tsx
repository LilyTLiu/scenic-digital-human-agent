import { useEffect, useState } from 'react'
import { checkinApi } from '../../services/api'

const SPOT_LIST = [
  '灵山大佛',
  '九龙灌浴',
  '灵山梵宫',
  '五印坛城',
  '祥符禅寺',
  '灵山大照壁',
  '五明桥',
  '佛手广场',
  '曼飞龙塔',
  '灵山精舍',
  '拈花湾禅意小镇',
]

interface Checkin {
  id: number
  spot_id: string
  author: string
  image: string
  caption: string
  created_at: string
}

export default function Checkins() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterSpot, setFilterSpot] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Checkin | null>(null)

  const pageSize = 50

  const load = (p?: number, spot?: string) => {
    const currentPage = p ?? page
    const currentSpot = spot ?? filterSpot
    setLoading(true)
    setError('')
    checkinApi
      .list(currentSpot, currentPage, pageSize)
      .then((d) => {
        setCheckins(d.items || [])
        setTotal(d.total || 0)
      })
      .catch(() => setError('加载打卡数据失败，请确认后端已启动'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleFilterChange = (spotId: string) => {
    setFilterSpot(spotId)
    setPage(1)
    load(1, spotId)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    load(newPage)
  }

  const handleDelete = async (checkin: Checkin) => {
    try {
      await checkinApi.delete(checkin.id)
      setDeleteConfirm(null)
      load()
    } catch {
      setError('删除失败')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  /* ── Loading ── */
  if (loading && checkins.length === 0) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <span>加载打卡数据中…</span>
      </div>
    )
  }

  return (
    <div>
      <h2 className="admin-page-title">游客打卡管理</h2>
      <p className="admin-page-subtitle">查看和管理游客在各景区的打卡记录</p>

      {/* ── Filter toolbar ── */}
      <div className="admin-panel">
        <div className="admin-toolbar">
          <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginRight: 4 }}>
            按景区筛选：
          </label>
          <select
            className="admin-select"
            value={filterSpot}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="">全部景区</option>
            {SPOT_LIST.map((spot) => (
              <option key={spot} value={spot}>
                {spot}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginLeft: 'auto' }}>
            共 {total} 条打卡
          </span>
        </div>

        {/* ── Error ── */}
        {error && <div className="admin-error">{error}</div>}

        {/* ── Table ── */}
        {!error && checkins.length === 0 ? (
          <div className="admin-empty">暂无打卡数据</div>
        ) : !error ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>景区</th>
                    <th>作者</th>
                    <th>内容</th>
                    <th>图片</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((checkin) => (
                    <tr key={checkin.id}>
                      <td>{checkin.id}</td>
                      <td>
                        <span className="admin-tag admin-tag--teal">{checkin.spot_id}</span>
                      </td>
                      <td>{checkin.author || '-'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {checkin.caption
                          ? checkin.caption.slice(0, 60) + (checkin.caption.length > 60 ? '...' : '')
                          : '-'}
                      </td>
                      <td>
                        {checkin.image ? (
                          <img
                            src={checkin.image}
                            alt="打卡图片"
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 6,
                              objectFit: 'cover',
                              border: '1px solid var(--admin-border)',
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                            无图片
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                        {checkin.created_at
                          ? new Date(checkin.created_at).toLocaleString('zh-CN')
                          : '-'}
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn--danger admin-btn--xs"
                          onClick={() => setDeleteConfirm(checkin)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  className="admin-page-btn"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  上一页
                </button>

                {(() => {
                  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
                    (p) => {
                      if (p === 1 || p === totalPages) return true
                      if (Math.abs(p - page) <= 2) return true
                      return false
                    },
                  )

                  const elements: React.ReactNode[] = []
                  for (let i = 0; i < visiblePages.length; i++) {
                    const p = visiblePages[i]
                    if (i > 0 && visiblePages[i - 1] < p - 1) {
                      elements.push(
                        <span key={`dot-${p}`} className="admin-page-info">
                          ...
                        </span>,
                      )
                    }
                    elements.push(
                      <button
                        key={p}
                        className={`admin-page-btn${p === page ? ' admin-page-btn--active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>,
                    )
                  }
                  return elements
                })()}

                <button
                  className="admin-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  下一页
                </button>

                <span className="admin-page-info">
                  {page} / {totalPages} 页
                </span>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">确认删除</div>
              <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}>
                &#x2715;
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-confirm-text">
                确定要删除「{deleteConfirm.author || '匿名用户'}」在「{deleteConfirm.spot_id}
                」的打卡记录吗？此操作不可撤销。
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteConfirm(null)}>
                取消
              </button>
              <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(deleteConfirm)}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
