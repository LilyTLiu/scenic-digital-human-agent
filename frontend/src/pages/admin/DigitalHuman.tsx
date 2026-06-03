import { Card, Row, Col, Typography, Button, Select, Slider, Tag, Space } from 'antd'
import { EditOutlined, PlayCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function DigitalHuman() {
  return (
    <div>
      <Title level={4}>数字人形象管理</Title>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Card title="当前数字人">
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 80 }}>🧑‍💼</div>
              <Title level={5}>小灵 - 灵山专属导游</Title>
              <Tag color="blue">当前使用</Tag>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>外观配置</Text>
              <div style={{ marginTop: 8 }}>
                <Select
                  style={{ width: '100%' }}
                  defaultValue="casual"
                  options={[
                    { value: 'casual', label: '休闲风格' },
                    { value: 'traditional', label: '汉服风格' },
                    { value: 'formal', label: '正装风格' },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>语音配置</Text>
              <div style={{ marginTop: 8 }}>
                <Select
                  style={{ width: '100%' }}
                  defaultValue="zh-CN-XiaoxiaoNeural"
                  options={[
                    { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 - 活泼女声' },
                    { value: 'zh-CN-YunxiNeural', label: '云希 - 男声' },
                    { value: 'zh-CN-XiaoyiNeural', label: '晓依 - 温柔女声' },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>语速: </Text>
              <Slider defaultValue={1.0} min={0.5} max={2.0} step={0.1} />
            </div>

            <Space style={{ marginTop: 16 }}>
              <Button icon={<PlayCircleOutlined />} type="primary">试听语音</Button>
              <Button icon={<EditOutlined />}>上传形象</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="其他数字人">
            <Card size="small" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 36 }}>🧘</span>
                <div>
                  <Text strong>慧觉</Text>
                  <br />
                  <Text type="secondary">禅意风格，沉稳博学，适合佛教文化讲解</Text>
                </div>
                <Button size="small" style={{ marginLeft: 'auto' }}>启用</Button>
              </div>
            </Card>
            <Card size="small" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 36 }}>👩‍🎨</span>
                <div>
                  <Text strong>妙音</Text>
                  <br />
                  <Text type="secondary">艺术风格，擅长梵宫艺术鉴赏讲解</Text>
                </div>
                <Button size="small" style={{ marginLeft: 'auto' }}>启用</Button>
              </div>
            </Card>
            <Card size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 36 }}>👴</span>
                <div>
                  <Text strong>禅翁</Text>
                  <br />
                  <Text type="secondary">长者风格，讲述祥符禅寺千年历史</Text>
                </div>
                <Button size="small" style={{ marginLeft: 'auto' }}>启用</Button>
              </div>
            </Card>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
