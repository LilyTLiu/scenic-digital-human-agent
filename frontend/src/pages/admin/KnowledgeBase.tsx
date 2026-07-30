import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../../services/api'

/* ── Types ── */
interface KnowledgeItem {
  id: number
  title: string
  content: string
  category: string
  scenic_spot: string
  created_at: string
  updated_at: string
}

interface FormData {
  title: string
  content: string
  category: string
  scenic_spot: string
}

const EMPTY_FORM: FormData = { title: '', content: '', category: '', scenic_spot: '灵山胜境' }

const CATEGORIES = [
  '景点讲解',
  '文史资料',
  '游览信息',
  '常见问题',
  '餐饮',
  '交通',
  '服务',
  '通用',
  '上传文档',
]

const CATEGORY_TAG_MAP: Record<string, string> = {
  '景点讲解': 'admin-tag--gold',
  '文史资料': 'admin-tag--teal',
  '游览信息': 'admin-tag--green',
  '常见问题': 'admin-tag--blue',
  '餐饮': 'admin-tag--gold',
  '交通': 'admin-tag--teal',
  '服务': 'admin-tag--green',
  '通用': 'admin-tag--blue',
  '上传文档': 'admin-tag--red',
}

const PAGE_SIZE = 20

/* ── Helpers ── */
const truncate = (text: string, max = 80) =>
  text.length > max ? text.slice(0, max) + '…' : text

const formatDate = (v: string) => {
  if (!v) return '-'
  return new Date(v).toLocaleString('zh-CN')
}

/* ── Component ── */
export default function KnowledgeBase() {
  /* state */
  const [data, setData] = useState<KnowledgeItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')

  /* modal state */
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  /* delete confirm */
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* upload & import */
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadFileName, setUploadFileName] = useState('')
  const [importing, setImporting] = useState(false)

  /* toasts */
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }, [])

  /* ── data loading ── */
  const load = useCallback(
    (p = page, kw = keyword, cat = category) => {
      setLoading(true)
      setError('')
      adminApi
        .getKnowledge({ page: p, size: PAGE_SIZE, keyword: kw, category: cat })
        .then((d: any) => {
          setData(d.items || [])
          setTotal(d.total ?? 0)
        })
        .catch(() => setError('加载失败，请稍后重试'))
        .finally(() => setLoading(false))
    },
    [page, keyword, category],
  )

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = () => {
    setPage(1)
    load(1, keyword, category)
  }

  const onCategoryChange = (v: string) => {
    setCategory(v)
    setPage(1)
    load(1, keyword, v)
  }

  /* ── create / edit ── */
  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (item: KnowledgeItem) => {
    setEditing(item)
    setForm({
      title: item.title,
      content: item.content,
      category: item.category,
      scenic_spot: item.scenic_spot || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { showToast('error', '请输入标题'); return }
    if (!form.category) { showToast('error', '请选择分类'); return }
    if (!form.content.trim()) { showToast('error', '请输入内容'); return }

    setSaving(true)
    try {
      if (editing) {
        await adminApi.updateKnowledge(String(editing.id), form)
        showToast('success', '更新成功')
      } else {
        await adminApi.createKnowledge(form)
        showToast('success', '创建成功')
      }
      setModalOpen(false)
      load(page, keyword, category)
    } catch (e: any) {
      showToast('error', e?.response?.data?.detail || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  /* ── delete ── */
  const confirmDelete = (item: KnowledgeItem) => {
    setDeleteTarget(item)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deleteKnowledge(String(deleteTarget.id))
      showToast('success', '已删除')
      setDeleteTarget(null)
      load(page, keyword, category)
    } catch {
      showToast('error', '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  /* ── upload ── */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setUploadFileName(file.name)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('scenic_spot', '灵山胜境')
    fd.append('category', '上传文档')

    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) setUploadProgress(Math.round((evt.loaded / evt.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          showToast('success', `上传成功: ${result.title || file.name} (${result.chroma_chunks || '?'} 个片段)`)
        } catch { showToast('success', `上传成功: ${file.name}`) }
        load(page, keyword, category)
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          showToast('error', (err as any).detail || `上传失败 (HTTP ${xhr.status})`)
        } catch { showToast('error', `上传失败 (HTTP ${xhr.status})`) }
      }
      setUploading(false)
      setUploadFileName('')
    })
    xhr.addEventListener('error', () => {
      showToast('error', '网络错误，上传失败')
      setUploading(false)
      setUploadFileName('')
    })
    xhr.open('POST', '/api/upload/document')
    xhr.send(fd)
    e.target.value = ''
  }

  /* ── import demo ── */
  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await adminApi.importDemo()
      showToast('success', res.message || `导入了 ${res.imported} 条`)
      load()
    } catch {
      showToast('error', '导入失败')
    } finally {
      setImporting(false)
    }
  }

  /* ── pagination helpers ── */
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
    load(p, keyword, category)
  }

  /* ── render ── */
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 200,
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 500,
            color: '#fff',
            background: toast.type === 'success' ? 'var(--admin-green)' : 'var(--admin-red)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          {toast.text}
        </div>
      )}

      {/* ════ Panel ════ */}
      <div className="admin-panel">
        {/* Header */}
        <div className="admin-panel-header">
          <div className="admin-panel-title">知识库管理</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Upload */}
            <label className="admin-btn admin-btn--secondary" style={{ cursor: 'pointer' }}>
              {uploading ? (uploadProgress > 0 ? `上传中 ${uploadProgress}%` : '上传中…') : '上传文档'}
              <input
                type="file"
                accept=".docx,.xlsx,.txt"
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>

            <button className="admin-btn admin-btn--primary" onClick={openCreate}>
              新增条目
            </button>

            <button
              className="admin-btn admin-btn--secondary"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? '导入中…' : '导入示例资料'}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <input
            className="admin-search-input"
            type="text"
            placeholder="搜索标题/内容..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSearch() }}
          />
          <select
            className="admin-select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="">全部分类</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => load()}>
            刷新
          </button>
        </div>

        {/* Body */}
        <div className="admin-panel-body admin-panel-body--flush">
          {error ? (
            <div className="admin-error">{error}</div>
          ) : loading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              加载中…
            </div>
          ) : data.length === 0 ? (
            <div className="admin-empty">暂无知识条目，请上传文档或手动新增</div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>标题</th>
                      <th>分类</th>
                      <th>景区</th>
                      <th>内容预览</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr key={row.id}>
                        <td>{row.title}</td>
                        <td>
                          <span className={`admin-tag ${CATEGORY_TAG_MAP[row.category] || 'admin-tag--blue'}`}>
                            {row.category || '-'}
                          </span>
                        </td>
                        <td>{row.scenic_spot || '-'}</td>
                        <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {truncate(row.content)}
                        </td>
                        <td>{formatDate(row.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="admin-btn admin-btn--secondary admin-btn--xs"
                              onClick={() => openEdit(row)}
                            >
                              编辑
                            </button>
                            <button
                              className="admin-btn admin-btn--danger admin-btn--xs"
                              onClick={() => confirmDelete(row)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="admin-pagination">
                  <button
                    className="admin-page-btn"
                    disabled={page <= 1}
                    onClick={() => goPage(page - 1)}
                  >
                    上一页
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // show first, last, and around current
                      if (p === 1 || p === totalPages) return true
                      if (Math.abs(p - page) <= 2) return true
                      return false
                    })
                    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '…' ? (
                        <span key={`ellipsis-${i}`} className="admin-page-info">…</span>
                      ) : (
                        <button
                          key={p}
                          className={`admin-page-btn ${page === p ? 'admin-page-btn--active' : ''}`}
                          onClick={() => goPage(p as number)}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  <button
                    className="admin-page-btn"
                    disabled={page >= totalPages}
                    onClick={() => goPage(page + 1)}
                  >
                    下一页
                  </button>
                  <span className="admin-page-info">共 {total} 条</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════ Create / Edit Modal ════ */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                {editing ? '编辑知识条目' : '新增知识条目'}
              </div>
              <button className="admin-modal-close" onClick={closeModal}>
                &#x2715;
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">标题</label>
                <input
                  className="admin-form-input"
                  type="text"
                  placeholder="请输入标题"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">分类</label>
                <select
                  className="admin-select"
                  style={{ width: '100%', borderRadius: 'var(--admin-radius-sm)' }}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">请选择分类</option>
                  {CATEGORIES.filter((c) => c !== '上传文档').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">所属景区</label>
                <input
                  className="admin-form-input"
                  type="text"
                  placeholder="灵山胜境"
                  value={form.scenic_spot}
                  onChange={(e) => setForm({ ...form, scenic_spot: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">内容</label>
                <textarea
                  className="admin-form-textarea"
                  rows={8}
                  placeholder="请输入知识条目内容"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn--secondary" onClick={closeModal} disabled={saving}>
                取消
              </button>
              <button className="admin-btn admin-btn--primary" onClick={handleSubmit} disabled={saving}>
                {saving ? '保存中…' : editing ? '保存修改' : '创建条目'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Delete Confirmation Modal ════ */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => { if (!deleting) setDeleteTarget(null) }}>
          <div className="admin-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">确认删除</div>
              <button
                className="admin-modal-close"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                &#x2715;
              </button>
            </div>

            <div className="admin-modal-body">
              <p className="admin-confirm-text">
                确定要删除条目「{deleteTarget.title}」吗？同时会清理 ChromaDB 中的向量数据。
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                取消
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
