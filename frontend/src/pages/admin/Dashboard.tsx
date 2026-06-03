import { Card, Row, Col, Statistic, Table, Typography } from 'antd'
import { TeamOutlined, QuestionCircleOutlined, SmileOutlined, MessageOutlined } from '@ant-design/icons'

const { Title } = Typography

const hotQuestions = [
  { key: '1', question: '灵山大佛有多高？', count: 328 },
  { key: '2', question: '九龙灌浴表演时间是几点？', count: 256 },
  { key: '3', question: '门票多少钱？', count: 198 },
  { key: '4', question: '灵山胜境的历史由来？', count: 175 },
  { key: '5', question: '推荐什么游览路线？', count: 152 },
]

const columns = [
  { title: '热门问题', dataIndex: 'question', key: 'question' },
  { title: '提问次数', dataIndex: 'count', key: 'count', width: 100 },
]

export default function Dashboard() {
  return (
    <div>
      <Title level={4}>数据大屏</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="今日服务人次" value={1286} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="本周服务人次" value={8924} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="热门问题数" value={45} prefix={<QuestionCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="游客满意度" value="95.2%" prefix={<SmileOutlined />} suffix="/100" />
          </Card>
        </Col>
      </Row>

      <Card title={<span><MessageOutlined /> 热门问答排行</span>} style={{ marginBottom: 24 }}>
        <Table
          dataSource={hotQuestions}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="每日服务趋势">
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              图表组件待集成 (ECharts/Recharts)
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="满意度趋势">
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              图表组件待集成 (ECharts/Recharts)
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
