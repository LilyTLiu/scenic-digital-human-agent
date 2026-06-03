import { Card, Row, Col, Typography, Table, Tag } from 'antd'

const { Title, Paragraph } = Typography

const sentimentData = [
  { key: '1', date: '2025-12-04', positive: 78, neutral: 15, negative: 7, topTopic: '灵山大佛' },
  { key: '2', date: '2025-12-03', positive: 82, neutral: 12, negative: 6, topTopic: '九龙灌浴' },
  { key: '3', date: '2025-12-02', positive: 75, neutral: 18, negative: 7, topTopic: '梵宫艺术' },
  { key: '4', date: '2025-12-01', positive: 80, neutral: 14, negative: 6, topTopic: '游览路线' },
  { key: '5', date: '2025-11-30', positive: 71, neutral: 20, negative: 9, topTopic: '餐饮服务' },
]

const columns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  {
    title: '正面', dataIndex: 'positive', key: 'positive',
    render: (v: number) => <Tag color="green">{v}%</Tag>,
  },
  {
    title: '中性', dataIndex: 'neutral', key: 'neutral',
    render: (v: number) => <Tag color="blue">{v}%</Tag>,
  },
  {
    title: '负面', dataIndex: 'negative', key: 'negative',
    render: (v: number) => <Tag color="red">{v}%</Tag>,
  },
  { title: '热门话题', dataIndex: 'topTopic', key: 'topTopic' },
]

export default function ReportPage() {
  return (
    <div>
      <Title level={4}>游客反馈报告</Title>
      <Paragraph type="secondary">基于AI分析的游客交互情感趋势与服务建议</Paragraph>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, color: '#52c41a' }}>77.2%</div>
              <div>整体正面情感占比</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, color: '#1677ff' }}>12</div>
              <div>本周新增关注话题</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, color: '#faad14' }}>5</div>
              <div>待优化服务项</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="每日情感趋势">
        <Table dataSource={sentimentData} columns={columns} pagination={false} size="small" />
      </Card>

      <Card title="服务建议" style={{ marginTop: 16 }}>
        <ul style={{ paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>增加"九龙灌浴表演时间"相关知识的覆盖，该问题近期提问量上升</li>
          <li style={{ marginBottom: 8 }}>优化"餐饮推荐"类问题的回答质量，游客满意度略低</li>
          <li style={{ marginBottom: 8 }}>考虑增加英文版本数字人，满足国际游客需求</li>
          <li>定期更新节假日特别活动信息到知识库</li>
        </ul>
      </Card>
    </div>
  )
}
