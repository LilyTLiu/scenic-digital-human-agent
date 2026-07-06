import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Typography, Modal } from 'antd'
import { TeamOutlined, QuestionCircleOutlined, MessageOutlined, BarChartOutlined, UserOutlined } from '@ant-design/icons'
import { adminApi } from '../../services/api'

const { Title } = Typography

interface DashboardData {
  today_visitors: number
  week_visitors: number
  today_tourists: number
  week_tourists: number
  hot_questions: { question: string; count: number }[]
  daily_trend: { date: string; count: number }[]
  total_questions: number
}

interface TouristInfo {
  user_id: number
  phone: string
  nickname: string
  msg_count: number
  last_active: string
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tourists, setTourists] = useState<TouristInfo[]>([])
  const [touristModalOpen, setTouristModalOpen] = useState(false)

  useEffect(() => {
    adminApi.getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openTouristList = async () => {
    setTouristModalOpen(true)
    try {
      const res = await adminApi.getTourists()
      setTourists(res.tourists || [])
    } catch {
      // ignore
    }
  }

  const hotColumns = [
    { title: '热门问题', dataIndex: 'question', key: 'question' },
    { title: '提问次数', dataIndex: 'count', key: 'count', width: 100 },
  ]

  const touristColumns = [
    { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '提问次数', dataIndex: 'msg_count', key: 'msg_count', width: 80 },
    { title: '最近活跃', dataIndex: 'last_active', key: 'last_active', width: 160, render: (v: string) => v?.slice(0, 19) },
  ]

  const maxCount = data?.daily_trend?.length
    ? Math.max(...data.daily_trend.map((d) => d.count), 1)
    : 1

  return (
    <div>
      <Title level={4}>数据大屏</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={4}>
          <Card loading={loading}>
            <Statistic title="今日服务人次" value={data?.today_visitors || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card loading={loading}>
            <Statistic title="本周服务人次" value={data?.week_visitors || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card loading={loading}>
            <Statistic title="累计问答数" value={data?.total_questions || 0} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card loading={loading}>
            <Statistic title="热门问题数" value={data?.hot_questions?.length || 0} prefix={<QuestionCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card
            loading={loading}
            hoverable
            onClick={openTouristList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="服务游客数 ▼"
              value={data?.today_tourists || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card
            title={<span><BarChartOutlined /> 近7天服务趋势</span>}
            loading={loading}
            style={{ marginBottom: 24 }}
          >
            {data?.daily_trend?.length ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, paddingTop: 8 }}>
                {data.daily_trend.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{d.count}</span>
                    <div style={{
                      width: '100%', maxWidth: 40,
                      height: `${Math.max((d.count / maxCount) * 140, 4)}px`,
                      background: 'linear-gradient(180deg, #c8963e, #e8c97a)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s',
                    }} />
                    <span style={{ fontSize: 10, color: '#999', marginTop: 6 }}>{d.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={<span><MessageOutlined /> 今日热门问答 Top5</span>}
            loading={loading}
            style={{ marginBottom: 24 }}
          >
            <Table
              dataSource={data?.hot_questions || []}
              columns={hotColumns}
              rowKey="question"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无数据' }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="服务游客列表"
        open={touristModalOpen}
        onCancel={() => setTouristModalOpen(false)}
        footer={null}
        width={700}
      >
        <Table
          dataSource={tourists}
          columns={touristColumns}
          rowKey="user_id"
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无已登录游客记录' }}
        />
      </Modal>
    </div>
  )
}
