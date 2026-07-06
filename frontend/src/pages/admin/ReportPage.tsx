import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Statistic } from 'antd'
import { SmileOutlined, FrownOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons'
import { adminApi } from '../../services/api'

const { Title } = Typography

interface ReportData {
  total_feedback: number
  likes: number
  dislikes: number
  satisfaction: number
  recent: { rating: number; question: string; time: string }[]
  daily_trend: { date: string; rate: number }[]
}

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getReports()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: '问题内容', dataIndex: 'question', key: 'question', ellipsis: true },
    {
      title: '评分', dataIndex: 'rating', key: 'rating', width: 80,
      render: (v: number) => v === 1
        ? <Tag color="green">👍 满意</Tag>
        : <Tag color="red">👎 不满意</Tag>,
    },
    { title: '时间', dataIndex: 'time', key: 'time', width: 160, render: (v: string) => v?.slice(0, 19) },
  ]

  const maxRate = data?.daily_trend?.length
    ? Math.max(...data.daily_trend.map((d) => d.rate), 1)
    : 1

  return (
    <div>
      <Title level={4}>游客反馈报告</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic title="满意度" value={data?.satisfaction || 0}
              suffix="%" prefix={<SmileOutlined />} precision={1} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic title="好评数" value={data?.likes || 0}
              prefix={<LikeOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic title="差评数" value={data?.dislikes || 0}
              prefix={<FrownOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic title="总反馈数" value={data?.total_feedback || 0}
              prefix={<MessageOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="近7天满意度趋势" loading={loading} style={{ marginBottom: 24 }}>
            {data?.daily_trend?.length ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, paddingTop: 8 }}>
                {data.daily_trend.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: d.rate >= 50 ? '#52c41a' : '#ff4d4f', marginBottom: 4 }}>
                      {d.rate}%
                    </span>
                    <div style={{
                      width: '100%', maxWidth: 40,
                      height: `${Math.max((d.rate / maxRate) * 120, 4)}px`,
                      background: d.rate >= 50
                        ? 'linear-gradient(180deg, #52c41a, #95de64)'
                        : 'linear-gradient(180deg, #ff4d4f, #ff9c9c)',
                      borderRadius: '4px 4px 0 0', transition: 'height 0.5s',
                    }} />
                    <span style={{ fontSize: 10, color: '#999', marginTop: 6 }}>{d.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                暂无反馈数据
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="最近反馈记录" loading={loading} style={{ marginBottom: 24 }}>
            <Table
              dataSource={data?.recent || []}
              columns={columns}
              rowKey={(_: any, i?: number) => String(i)}
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无反馈记录' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="服务建议" style={{ marginTop: 16 }}>
        <ul style={{ paddingLeft: 20, fontSize: 13, color: '#666', lineHeight: 2 }}>
          <li>游客在AI对话界面可对每条回复进行 👍👎 评分</li>
          <li>评分数据实时汇总到本页面，用于分析游客满意度趋势</li>
          <li>低满意度时段可针对性优化知识库内容和回复策略</li>
          <li>定期检查差评问题，补充缺失知识点到知识库</li>
        </ul>
      </Card>
    </div>
  )
}
