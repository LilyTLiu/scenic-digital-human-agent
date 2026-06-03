import { useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Space, Typography, Upload } from 'antd'
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title } = Typography

const mockData = [
  { id: '1', title: '灵山大佛介绍', category: '景点讲解', scenic: '灵山胜境', updated: '2025-12-01' },
  { id: '2', title: '九龙灌浴表演时间', category: '游览信息', scenic: '灵山胜境', updated: '2025-12-02' },
  { id: '3', title: '祥符禅寺历史', category: '文史资料', scenic: '灵山胜境', updated: '2025-11-28' },
  { id: '4', title: '梵宫艺术鉴赏', category: '景点讲解', scenic: '灵山胜境', updated: '2025-12-03' },
  { id: '5', title: '游览路线推荐', category: '常见问题', scenic: '灵山胜境', updated: '2025-11-30' },
]

const columns = [
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '分类', dataIndex: 'category', key: 'category' },
  { title: '景区', dataIndex: 'scenic', key: 'scenic' },
  { title: '更新时间', dataIndex: 'updated', key: 'updated' },
  {
    title: '操作', key: 'action', width: 150,
    render: () => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
      </Space>
    ),
  },
]

export default function KnowledgeBase() {
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>知识库管理</Title>
        <Space>
          <Upload>
            <Button icon={<UploadOutlined />}>批量导入</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增条目
          </Button>
        </Space>
      </div>

      <Card>
        <Table dataSource={mockData} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title="新增知识条目"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => { form.submit(); setModalOpen(false) }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select
              options={[
                { value: '景点讲解', label: '景点讲解' },
                { value: '文史资料', label: '文史资料' },
                { value: '游览信息', label: '游览信息' },
                { value: '常见问题', label: '常见问题' },
              ]}
            />
          </Form.Item>
          <Form.Item name="scenic" label="所属景区">
            <Input placeholder="灵山胜境" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="请输入知识条目内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
