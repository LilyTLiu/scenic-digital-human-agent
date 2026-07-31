import { useEffect, useState } from 'react'
import { lostFoundApi } from '../../services/api'

interface LostFoundItem {
  id: number
  item_name: string
  item_type: string
  location: string
  description: string
  contact: string
  status: string
  created_at: string
}

const typeLabels: Record<string, string> = {
  lost: '寻物',
  found: '招领',
}

export default function LostFound() {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<LostFoundItem | null>(null)
  const [editingItem, setEditingItem] = useState<LostFoundItem | null>(null)
  const [editForm, setEditForm] = useState({
    item_name: '',
    item_type: 'lost',
    location: '',
    description: '',
    contact: '',
    status: 'open',
  })

  const pageSize = 50

  const load = (p?: number, status?: string) => {
    const currentPage = p ?? page
    const currentStatus = status ?? filterStatus
    setLoading(true)
    setError('')
    lostFoundApi
      .list(currentPage, pageSize, currentStatus)
      .then((d) => {
        setItems(d.items || [])
        setTotal(d.total || 0)
      })
      .catch(() => setError('加载失物招领数据失败，请确认后端已启动'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleFilterChange = (status: string) => {
    setFilterStatus(status)
    setPage(1)
    load(1, status)
  }

  const handleStatusChange = async (item: LostFoundItem, status: string) => {
    try {
      await lostFoundApi.update(item.id, { status })
      load()
    } catch {
      setError('状态更新失败')
    }
  }

  const openEdit = (item: LostFoundItem) => {
    setEditingItem(item)
    setEditForm({
      item_name: item.item_name || '',
      item_type: item.item_type || 'lost',
      location: item.location || '',
      description: item.description || '',
      contact: item.contact || '',
      status: item.status || 'open',
    })
  }

  const handleUpdate = async () => {
    if (!editingItem || !editForm.item_name.trim()) {
      setError('请填写物品名称')
      return
    }
    try {
      await lostFoundApi.update(editingItem.id, {
        item_name: editForm.item_name.trim(),
        item_type: editForm.item_type,
        location: editForm.location.trim(),
        description: editForm.description.trim(),
        contact: editForm.contact.trim(),
        status: editForm.status,
      })
      setEditingItem(null)
      load()
    } catch {
      setError('保存失败')
    }
  }

  const handleDelete = async (item: LostFoundItem) => {
    try {
      await lostFoundApi.delete(item.id)
      setDeleteConfirm(null)
      load()
    } catch {
      setError('删除失败')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (loading && items.length === 0) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <span>加载失物招领数据中…</span>
      </div>
    )
  }

  return (
    <div>
      <h2 className="admin-page-title">失物招领管理</h2>
      <p className="admin-page-subtitle">查看游客提交的寻物与招领条目，并维护处理状态</p>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <label style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginRight: 4 }}>
            按状态筛选：
          </label>
          <select
            className="admin-select"
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="open">待处理</option>
            <option value="claimed">已认领</option>
            <option value="closed">已关闭</option>
          </select>
          <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginLeft: 'auto' }}>
            共 {total} 条记录
          </span>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {!error && items.length === 0 ? (
          <div className="admin-empty">暂无失物招领数据</div>
        ) : !error ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>类型</th>
                    <th>物品</th>
                    <th>地点</th>
                    <th>说明</th>
                    <th>联系方式</th>
                    <th>状态</th>
                    <th>提交时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{(page - 1) * pageSize + index + 1}</td>
                      <td>
                        <span className={item.item_type === 'found' ? 'admin-tag admin-tag--teal' : 'admin-tag admin-tag--gold'}>
                          {typeLabels[item.item_type] || item.item_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                      <td>{item.location || '-'}</td>
                      <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || '-'}
                      </td>
                      <td>{item.contact || '-'}</td>
                      <td>
                        <select
                          className="admin-select"
                          value={item.status}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          style={{ padding: '4px 10px', borderRadius: 14, fontSize: 12 }}
                        >
                          <option value="open">待处理</option>
                          <option value="claimed">已认领</option>
                          <option value="closed">已关闭</option>
                        </select>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="admin-btn admin-btn--secondary admin-btn--xs"
                            onClick={() => openEdit(item)}
                          >
                            编辑
                          </button>
                          <button
                            className="admin-btn admin-btn--danger admin-btn--xs"
                            onClick={() => setDeleteConfirm(item)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  className="admin-page-btn"
                  disabled={page <= 1}
                  onClick={() => {
                    const next = page - 1
                    setPage(next)
                    load(next)
                  }}
                >
                  上一页
                </button>
                <span className="admin-page-info">
                  {page} / {totalPages} 页
                </span>
                <button
                  className="admin-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const next = page + 1
                    setPage(next)
                    load(next)
                  }}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">确认删除</div>
              <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: 0, color: 'var(--admin-text)' }}>
                确定删除“{deleteConfirm.item_name}”这条失物招领信息吗？
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteConfirm(null)}>
                取消
              </button>
              <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(deleteConfirm)}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="admin-modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">编辑失物招领</div>
              <button className="admin-modal-close" onClick={() => setEditingItem(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gap: 12 }}>
                <input
                  className="admin-search-input"
                  value={editForm.item_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, item_name: e.target.value }))}
                  placeholder="物品名称"
                  style={{ width: '100%', borderRadius: 8 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <select
                    className="admin-select"
                    value={editForm.item_type}
                    onChange={(e) => setEditForm((f) => ({ ...f, item_type: e.target.value }))}
                    style={{ borderRadius: 8 }}
                  >
                    <option value="lost">寻物</option>
                    <option value="found">招领</option>
                  </select>
                  <select
                    className="admin-select"
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    style={{ borderRadius: 8 }}
                  >
                    <option value="open">待处理</option>
                    <option value="claimed">已认领</option>
                    <option value="closed">已关闭</option>
                  </select>
                </div>
                <input
                  className="admin-search-input"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="地点"
                  style={{ width: '100%', borderRadius: 8 }}
                />
                <input
                  className="admin-search-input"
                  value={editForm.contact}
                  onChange={(e) => setEditForm((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="联系方式"
                  style={{ width: '100%', borderRadius: 8 }}
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="说明"
                  rows={4}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    color: 'var(--admin-text)',
                    background: 'var(--admin-surface)',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setEditingItem(null)}>
                取消
              </button>
              <button className="admin-btn admin-btn--primary" onClick={handleUpdate}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
