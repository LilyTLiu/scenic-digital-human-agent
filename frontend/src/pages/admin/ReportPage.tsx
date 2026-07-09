import { useEffect, useState } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Spin } from 'antd'
import { LikeOutlined, DislikeOutlined, CommentOutlined } from '@ant-design/icons'
import { adminApi } from '../../services/api'

const { Title } = Typography

interface ChatRecord {
  id: number; session_id: string; scenic_spot: string
  user_input: string; ai_reply: string; created_at: string
}

interface FeedbackItem {
  id: number; rating: number; question: string; created_at: string
}

export default function ReportPage() {
  const [records, setRecords] = useState<ChatRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [fbStats, setFbStats] = useState({ total: 0, likes: 0, dislikes: 0, rate: 0, recent: [] as FeedbackItem[] })
  const [stats, setStats] = useState({ totalChats: 0, totalSessions: 0, todayChats: 0 })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getFeedbackStats().catch(() => null),
    ]).then(([dash, fb]) => {
      setStats({ totalChats: dash.total_chats || 0, totalSessions: dash.total_sessions || 0, todayChats: dash.today_chats || 0 })
      if (fb) setFbStats(fb)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    adminApi.getChatRecords({ size: 30 }).then((d: any) => setRecords(d.items || [])).catch(() => {})
  }, [])

  const chatColumns = [
    { title: '时间', dataIndex: 'created_at', width: 150,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    { title: '游客提问', dataIndex: 'user_input', ellipsis: true },
    { title: 'AI 回复', dataIndex: 'ai_reply', ellipsis: true, width: 250,
      render: (v: string) => (v || '').slice(0, 80) + (v?.length > 80 ? '...' : '') },
    { title: '景区', dataIndex: 'scenic_spot', width: 80, render: (v: string) => <Tag>{v}</Tag> },
  ]

  const fbColumns = [
    { title: '时间', dataIndex: 'created_at', width: 150,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    { title: '评价', dataIndex: 'rating', width: 60,
      render: (v: number) => v === 1 ? <Tag color="green">👍 赞</Tag> : <Tag color="red">👎 踩</Tag> },
    { title: '问题', dataIndex: 'question', ellipsis: true },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>

  return (
    <div>
      <Title level={4}>游客反馈报告</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card><div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, color: '#c8963e' }}>{stats.totalChats}</div>
            <div>累计对话</div>
          </div></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, color: '#52c41a' }}>{fbStats.likes}</div>
            <div><LikeOutlined /> 点赞</div>
          </div></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, color: '#ff4d4f' }}>{fbStats.dislikes}</div>
            <div><DislikeOutlined /> 踩</div>
          </div></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, color: '#1677ff' }}>{fbStats.rate}%</div>
            <div>好评率</div>
          </div></Card>
        </Col>
      </Row>

      <Card title={<span><LikeOutlined /> 游客反馈评价</span>} style={{ marginBottom: 16 }}>
        <Table dataSource={fbStats.recent} columns={fbColumns} rowKey="id"
          pagination={false} size="small"
          locale={{ emptyText: '暂无反馈，游客使用对话时点击 👍👎 后自动记录' }} />
      </Card>

      <Card title={<span><CommentOutlined /> 最近对话记录</span>}>
        <Table dataSource={records} columns={chatColumns} rowKey="id"
          pagination={false} size="small"
          locale={{ emptyText: '暂无对话记录' }} />
      </Card>
    </div>
  )
}
