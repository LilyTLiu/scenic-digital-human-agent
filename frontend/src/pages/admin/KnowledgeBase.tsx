import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Space, Typography, Upload, message, Popconfirm } from 'antd'
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { adminApi } from '../../services/api'

const { Title } = Typography

interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  scenic_spot: string
  updated_at: string
}

export default function KnowledgeBase() {
  const [data, setData] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getKnowledge({ size: 100 })
      setData(res.items || [])
    } catch {
      message.error('无法连接后端')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (item: KnowledgeItem) => {
    setEditing(item)
    form.setFieldsValue(item)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await adminApi.updateKnowledge(editing.id, values)
        message.success('已更新')
      } else {
        await adminApi.createKnowledge(values)
        message.success('已创建')
      }
      setModalOpen(false)
      fetchData()
    } catch (e: any) {
      if (e?.errorFields) return // form validation
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteKnowledge(id)
      message.success('已删除')
      fetchData()
    } catch {
      message.error('删除失败')
    }
  }

  const handleUpload = async (info: any) => {
    const file = info.file
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('scenic_spot', '灵山胜境')
      formData.append('category', '文档导入')
      const resp = await fetch('/api/upload/document', { method: 'POST', body: formData })
      const result = await resp.json()
      if (result.status === 'indexed') {
        message.success(`导入成功，生成 ${result.chunks} 个向量片段`)
        fetchData()
      } else {
        message.error(result.error || '导入失败')
      }
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleImportDemo = async () => {
    setImporting(true)
    try {
      const resp = await fetch('/api/admin/import-demo', { method: 'POST' })
      const result = await resp.json()
      if (result.status === 'ok') {
        message.success(`已导入 ${result.imported} 条示例资料`)
        fetchData()
      } else {
        message.error(result.error || '导入失败')
      }
    } catch {
      message.error('导入请求失败，请确认后端已启动')
    } finally {
      setImporting(false)
    }
  }

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    { title: '景区', dataIndex: 'scenic_spot', key: 'scenic_spot', width: 100 },
    { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 130, render: (v: string) => v?.slice(0, 10) },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: any, record: KnowledgeItem) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>知识库管理</Title>
        <Space>
          <Upload
            accept=".txt,.docx"
            showUploadList={false}
            customRequest={({ file }: any) => handleUpload({ file })}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>导入文档</Button>
          </Upload>
          <Button icon={<UploadOutlined />} loading={importing} onClick={handleImportDemo}>导入示例资料</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增条目</Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      <Modal
        title={editing ? '编辑知识条目' : '新增知识条目'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={[
              { value: '景点讲解', label: '景点讲解' },
              { value: '文史资料', label: '文史资料' },
              { value: '游览信息', label: '游览信息' },
              { value: '常见问题', label: '常见问题' },
              { value: '文档导入', label: '文档导入' },
            ]} />
          </Form.Item>
          <Form.Item name="scenic_spot" label="所属景区">
            <Input placeholder="灵山胜境" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={6} placeholder="请输入知识条目内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
