import { useEffect, useState } from 'react'
import { reviewApi } from '../../services/api'

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

interface Review {
  id: number
  spot_id: string
  author: string
  rating: number
  text: string
  created_at: string
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterSpot, setFilterSpot] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Review | null>(null)

  const pageSize = 50

  const load = (p?: number, spot?: string) => {
    const currentPage = p ?? page
    const currentSpot = spot ?? filterSpot
    setLoading(true)
    setError('')
    reviewApi
      .list(currentSpot, currentPage, pageSize)
      .then((d) => {
        setReviews(d.items || [])
        setTotal(d.total || 0)
      })
      .catch(() => setError('加载评价数据失败，请确认后端已启动'))
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

  const handleDelete = async (review: Review) => {
    try {
      await reviewApi.delete(review.id)
      setDeleteConfirm(null)
      load()
    } catch {
      setError('删除失败')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const renderStars = (rating: number) => {
    const stars: string[] = []
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆')
    }
    return stars.join('')
  }

  /* ── Loading ── */
  if (loading && reviews.length === 0) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <span>加载评价数据中…</span>
      </div>
    )
  }

  return (
    <div>
      <h2 className="admin-page-title">游客评价管理</h2>
      <p className="admin-page-subtitle">查看和管理游客在各景区的评价记录</p>

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
            共 {total} 条评价
          </span>
        </div>

        {/* ── Error ── */}
        {error && <div className="admin-error">{error}</div>}

        {/* ── Table ── */}
        {!error && reviews.length === 0 ? (
          <div className="admin-empty">暂无评价数据</div>
        ) : !error ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>景区</th>
                    <th>作者</th>
                    <th>评分</th>
                    <th>内容</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td>{review.id}</td>
                      <td>
                        <span className="admin-tag admin-tag--gold">{review.spot_id}</span>
                      </td>
                      <td>{review.author || '-'}</td>
                      <td style={{ color: '#c8963e', fontSize: 14, whiteSpace: 'nowrap' }}>
                        {renderStars(review.rating)}
                      </td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {review.text ? review.text.slice(0, 60) + (review.text.length > 60 ? '...' : '') : '-'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                        {review.created_at ? new Date(review.created_at).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn--danger admin-btn--xs"
                          onClick={() => setDeleteConfirm(review)}
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

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, and pages around current
                    if (p === 1 || p === totalPages) return true
                    if (Math.abs(p - page) <= 2) return true
                    return false
                  })
                  .map((p, idx, arr) => {
                    const result: (number | string)[] = []
                    if (idx > 0 && (arr[idx - 1] as number) < p - 1) {
                      result.push('...')
                    }
                    result.push(p)
                    // Only render the last item
                    if (idx !== arr.length - 1) return null

                    // Flatten: render all accumulated
                    return null
                  })}

                {(() => {
                  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
                    if (p === 1 || p === totalPages) return true
                    if (Math.abs(p - page) <= 2) return true
                    return false
                  })

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
                」的评价吗？此操作不可撤销。
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
