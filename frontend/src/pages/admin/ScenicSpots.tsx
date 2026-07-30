import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'

interface ScenicSpot {
  id: number
  name: string
  slug: string
  description: string
  enabled: number
}

export default function ScenicSpots() {
  const [spots, setSpots] = useState<ScenicSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ScenicSpot | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<ScenicSpot | null>(null)

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getScenicSpots()
      .then((d) => setSpots(d.items || []))
      .catch(() => setError('加载景区列表失败，请确认后端已启动'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '' })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (spot: ScenicSpot) => {
    setEditing(spot)
    setForm({ name: spot.name, slug: spot.slug, description: spot.description || '' })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setFormError('')
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError('请输入景区名称')
      return
    }
    if (!editing && !form.slug.trim()) {
      setFormError('请输入集合名')
      return
    }
    if (!editing && !/^[a-z0-9_-]+$/.test(form.slug)) {
      setFormError('集合名仅允许小写字母、数字、下划线、连字符')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      if (editing) {
        await adminApi.updateScenicSpot(editing.id, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
        })
      } else {
        await adminApi.createScenicSpot({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
        })
      }
      closeModal()
      load()
    } catch (e: any) {
      setFormError(e?.response?.data?.detail || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (spot: ScenicSpot) => {
    try {
      await adminApi.deleteScenicSpot(spot.id)
      setDeleteConfirm(null)
      load()
    } catch {
      setFormError('停用失败')
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <span>加载景区数据中…</span>
      </div>
    )
  }

  /* ── Error ── */
  if (error) {
    return <div className="admin-error">{error}</div>
  }

  return (
    <div>
      <h2 className="admin-page-title">景区管理</h2>
      <p className="admin-page-subtitle">
        管理灵山景区信息。每个景点对应独立的 ChromaDB 知识库集合，添加后会预创建向量集合，配置后即可上传知识文档。
      </p>

      {/* ── Panel ── */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-title">景区列表</div>
          <button className="admin-btn admin-btn--primary" onClick={openCreate}>
            + 添加景区
          </button>
        </div>

        {/* ── Table ── */}
        {spots.length === 0 ? (
          <div className="admin-empty">暂无景区数据，点击上方按钮添加</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>景区名称</th>
                  <th>集合名 (slug)</th>
                  <th>描述</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {spots.map((spot) => (
                  <tr key={spot.id}>
                    <td>{spot.id}</td>
                    <td>{spot.name}</td>
                    <td>
                      <code style={{ fontSize: 12, color: 'var(--admin-teal)' }}>{spot.slug}</code>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {spot.description || '-'}
                    </td>
                    <td>
                      {spot.enabled ? (
                        <span className="admin-tag admin-tag--green">启用</span>
                      ) : (
                        <span className="admin-tag admin-tag--red">停用</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="admin-btn admin-btn--secondary admin-btn--sm"
                          onClick={() => openEdit(spot)}
                        >
                          编辑
                        </button>
                        <button
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          onClick={() => setDeleteConfirm(spot)}
                        >
                          停用
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">{editing ? '编辑景区' : '添加景区'}</div>
              <button className="admin-modal-close" onClick={closeModal}>
                &#x2715;
              </button>
            </div>
            <div className="admin-modal-body">
              {formError && (
                <div style={{ color: 'var(--admin-red)', fontSize: 13, marginBottom: 12 }}>{formError}</div>
              )}

              <div className="admin-form-group">
                <label className="admin-form-label">景区名称</label>
                <input
                  className="admin-form-input"
                  type="text"
                  placeholder="如：灵山胜境、故宫博物院"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">集合名（英文标识）</label>
                <input
                  className="admin-form-input"
                  type="text"
                  placeholder="如：lingshan, forbidden_city"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  disabled={!!editing}
                />
                <div className="admin-form-hint">仅允许小写字母、数字、下划线、连字符。创建后不可修改。</div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">描述</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="简短描述景区特色"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn--secondary" onClick={closeModal}>
                取消
              </button>
              <button
                className="admin-btn admin-btn--primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '提交中…' : editing ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">确认停用</div>
              <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}>
                &#x2715;
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-confirm-text">
                确定要停用景区「{deleteConfirm.name}」吗？停用后该景区将不在游客端显示，但相关数据会被保留。
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteConfirm(null)}>
                取消
              </button>
              <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(deleteConfirm)}>
                确认停用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
