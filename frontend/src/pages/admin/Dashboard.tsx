import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Typography, Spin } from 'antd'
import {
  TeamOutlined, QuestionCircleOutlined, MessageOutlined,
  DatabaseOutlined, UserOutlined,
} from '@ant-design/icons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { adminApi } from '../../services/api'

const { Title } = Typography

interface DashboardData {
  total_chats: number
  total_knowledge: number
  today_chats: number
  total_sessions: number
  hot_keywords: string[]
  daily_trend: { date: string; count: number }[]
  hourly_trend: { hour: string; count: number }[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getDashboard()
      .then(setData)
      .catch((e) => console.error('Dashboard fetch failed:', e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (!data) return <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>数据加载失败，请确认后端已启动</div>

  const keywordColumns = [
    { title: '热门问题', dataIndex: 'text', key: 'text', ellipsis: true },
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 60, align: 'center' as const },
  ]

  const keywordData = data.hot_keywords
    .filter(Boolean)
    .map((k, i) => ({ key: i, text: k, rank: i + 1 }))

  return (
    <div>
      <Title level={4}>数据大屏</Title>

      {/* ── 统计卡片 ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="今日对话"
              value={data.today_chats}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#c8963e' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card>
            <Statistic
              title="累计对话"
              value={data.total_chats}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card>
            <Statistic
              title="对话会话"
              value={data.total_sessions}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card>
            <Statistic
              title="知识条目"
              value={data.total_knowledge}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card>
            <Statistic
              title="热门话题"
              value={keywordData.length}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#5d7a8e' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── 趋势图表 ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="近 7 天对话趋势">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #f0ebe0' }}
                  formatter={(v) => [`${v} 次`, '对话量']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#c8963e"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#c8963e' }}
                  activeDot={{ r: 6 }}
                  name="对话量"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="今日时段分布 (8:00-21:00)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.hourly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                <XAxis dataKey="hour" fontSize={11} angle={-45} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #f0ebe0' }}
                  formatter={(v) => [`${v} 次`, '对话量']}
                />
                <Bar dataKey="count" fill="#5d7a8e" radius={[4, 4, 0, 0]} name="对话量" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ── 热门问题排行 ── */}
      <Card title={<span><QuestionCircleOutlined /> 热门问题排行</span>}>
        {keywordData.length > 0 ? (
          <Table
            dataSource={keywordData}
            columns={keywordColumns}
            pagination={false}
            size="small"
            locale={{ emptyText: '暂无数据，开始使用后自动统计' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
            暂无数据 — 游客开始提问后自动统计热门问题
          </div>
        )}
      </Card>
    </div>
  )
}
