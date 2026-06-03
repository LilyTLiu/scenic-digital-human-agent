import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Typography, Space } from 'antd'

const { Title, Paragraph } = Typography

// 预设数字人形象
const digitalHumans = [
  { id: 'dh_001', name: '小灵', desc: '灵山专属导游，热情专业', avatar: '🧑‍💼', voice: 'zh-CN-XiaoxiaoNeural' },
  { id: 'dh_002', name: '慧觉', desc: '禅意风格，沉稳博学', avatar: '🧘', voice: 'zh-CN-YunxiNeural' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      {/* 景区选择 */}
      <Title level={3} style={{ textAlign: 'center', marginTop: 40 }}>
        灵山胜境
      </Title>
      <Paragraph style={{ textAlign: 'center', color: '#666' }}>
        国家5A级旅游景区 · 世界佛教论坛永久会址
      </Paragraph>

      {/* 数字人选择 */}
      <Title level={5} style={{ marginTop: 32 }}>选择您的AI导游</Title>
      <Row gutter={12}>
        {digitalHumans.map((dh) => (
          <Col span={12} key={dh.id}>
            <Card
              hoverable
              style={{ textAlign: 'center' }}
              onClick={() => navigate(`/tourist/chat?human=${dh.id}`)}
            >
              <div style={{ fontSize: 48 }}>{dh.avatar}</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>{dh.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{dh.desc}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/tourist/chat')}
          style={{ width: 200, height: 48, fontSize: 16 }}
        >
          开始游览
        </Button>
      </div>
      <Paragraph style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
        支持语音和文字输入，数字人导游为您实时讲解
      </Paragraph>
    </div>
  )
}
