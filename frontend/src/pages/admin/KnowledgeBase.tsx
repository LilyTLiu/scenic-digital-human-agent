import { useEffect, useState } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select, Space, Typography,
  Upload, message, Popconfirm, Tag,
} from 'antd'
import {
  PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { adminApi } from '../../services/api'

const { Title } = Typography

interface KnowledgeItem {
  id: number
  title: string
  content: string
  category: string
  scenic_spot: string
  created_at: string
  updated_at: string
}

export default function KnowledgeBase() {
  const [data, setData] = useState<KnowledgeItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [form] = Form.useForm()

  const load = (p = page, kw = keyword, cat = category) => {
    setLoading(true)
    adminApi.getKnowledge({ page: p, size: 20, keyword: kw, category: cat })
      .then((d) => { setData(d.items || []); setTotal(d.total) })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const onSearch = () => { setPage(1); load(1, keyword, category) }

  const openCreate = () => {
    setEditing(null); form.resetFields(); setModalOpen(true)
  }

  const openEdit = (item: KnowledgeItem) => {
    setEditing(item)
    form.setFieldsValue(item)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    try {
      if (editing) {
        await adminApi.updateKnowledge(String(editing.id), values)
        message.success('更新成功')
      } else {
        await adminApi.createKnowledge(values)
        message.success('创建成功')
      }
      setModalOpen(false)
      load(page, keyword, category)
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteKnowledge(String(id))
      message.success('已删除')
      load(page, keyword, category)
    } catch { message.error('删除失败') }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('scenic_spot', '灵山胜境')
    fd.append('category', '上传文档')
    try {
      // Use raw fetch for multipart upload
      const resp = await fetch('/api/upload/document', { method: 'POST', body: fd })
      if (!resp.ok) throw new Error((await resp.json()).detail || 'Upload failed')
      const result = await resp.json()
      message.success(`上传成功: ${result.title} (${result.chroma_chunks} 个片段)`)
      load(page, keyword, category)
    } catch (e: any) {
      message.error(e?.message || '上传失败')
    } finally {
      setUploading(false)
    }
    return false // Prevent default upload behavior
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 100,
      render: (v: string) => <Tag>{v || '-'}</Tag>,
    },
    { title: '景区', dataIndex: 'scenic_spot', width: 100 },
    { title: '更新时间', dataIndex: 'updated_at', width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', width: 150,
      render: (_: any, r: KnowledgeItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？同时会清理 ChromaDB 中的向量。" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>知识库管理</Title>
        <Space>
          <Upload
            accept=".docx,.xlsx,.txt"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>上传文档</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增条目</Button>
          <Button
            icon={<UploadOutlined />}
            loading={importing}
            onClick={async () => {
              setImporting(true)
              try {
                const res = await adminApi.importDemo()
                message.success(res.message || `导入了 ${res.imported} 条`)
                load()
              } catch { message.error('导入失败') }
              finally { setImporting(false) }
            }}
          >导入示例资料</Button>
        </Space>
      </div>

      {/* 搜索栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索标题/内容..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={onSearch}
            style={{ width: 220 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="分类筛选"
            value={category || undefined}
            onChange={(v) => { setCategory(v || ''); setPage(1); load(1, keyword, v || '') }}
            allowClear
            style={{ width: 140 }}
            options={[
              { value: '景点讲解', label: '景点讲解' },
              { value: '文史资料', label: '文史资料' },
              { value: '游览信息', label: '游览信息' },
              { value: '常见问题', label: '常见问题' },
              { value: '餐饮', label: '餐饮' },
              { value: '交通', label: '交通' },
              { value: '服务', label: '服务' },
              { value: '通用', label: '通用' },
              { value: '上传文档', label: '上传文档' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => load()}>刷新</Button>
        </Space>
      </Card>

      <Card>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            current: page,
            total,
            pageSize: 20,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => { setPage(p); load(p, keyword, category) },
          }}
          locale={{ emptyText: '暂无知识条目，请上传文档或手动新增' }}
        />
      </Card>

      <Modal
        title={editing ? '编辑知识条目' : '新增知识条目'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={[
              { value: '景点讲解', label: '景点讲解' },
              { value: '文史资料', label: '文史资料' },
              { value: '游览信息', label: '游览信息' },
              { value: '常见问题', label: '常见问题' },
              { value: '餐饮', label: '餐饮' },
              { value: '交通', label: '交通' },
              { value: '服务', label: '服务' },
              { value: '通用', label: '通用' },
            ]} />
          </Form.Item>
          <Form.Item name="scenic_spot" label="所属景区" initialValue="灵山胜境">
            <Input placeholder="灵山胜境" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={8} placeholder="请输入知识条目内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
