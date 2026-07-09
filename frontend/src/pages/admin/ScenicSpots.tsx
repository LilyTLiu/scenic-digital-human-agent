import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Space, Typography, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, GlobalOutlined } from '@ant-design/icons'
import { adminApi } from '../../services/api'

const { Title } = Typography

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
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ScenicSpot | null>(null)
  const [form] = Form.useForm()

  const load = () => {
    setLoading(true)
    adminApi.getScenicSpots()
      .then((d) => setSpots(d.items || []))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (spot: ScenicSpot) => {
    setEditing(spot)
    form.setFieldsValue(spot)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    try {
      if (editing) {
        await adminApi.updateScenicSpot(editing.id, values)
        message.success('更新成功')
      } else {
        await adminApi.createScenicSpot(values)
        message.success('添加成功')
      }
      setModalOpen(false)
      load()
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteScenicSpot(id)
      message.success('已停用')
      load()
    } catch { message.error('删除失败') }
  }

  const columns = [
    { title: 'id', dataIndex: 'id', width: 60 },
    { title: '景区名称', dataIndex: 'name', ellipsis: true },
    { title: '集合名 (slug)', dataIndex: 'slug' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '状态', dataIndex: 'enabled', width: 80,
      render: (v: number) => v ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag>,
    },
    {
      title: '操作', width: 150,
      render: (_: any, r: ScenicSpot) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定停用该景区？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>停用</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4}><GlobalOutlined /> 景区管理</Title>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, color: '#999', fontSize: 13 }}>
          每个景区对应独立的 ChromaDB 知识库集合。添加景区后会预创建向量集合，配置后即可上传知识文档。
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>添加景区</Button>
      </Card>

      <Table
        dataSource={spots}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: '暂无景区数据' }}
      />

      <Modal
        title={editing ? '编辑景区' : '添加景区'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="景区名称" rules={[{ required: true, message: '请输入景区名称' }]}>
            <Input placeholder="如：灵山胜境、故宫博物院" />
          </Form.Item>
          <Form.Item name="slug" label="集合名（英文标识）" rules={[{ required: true, message: '请输入集合名' },
            { pattern: /^[a-z0-9_-]+$/, message: '仅允许小写字母、数字、下划线、连字符' }
          ]}>
            <Input placeholder="如：lingshan, forbidden_city" disabled={!!editing} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="简短描述景区特色" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
