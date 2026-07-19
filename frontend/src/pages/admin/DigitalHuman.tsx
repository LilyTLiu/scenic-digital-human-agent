import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Button, Tag, message, Space } from 'antd'
import { CheckCircleOutlined, SwapOutlined } from '@ant-design/icons'
import { adminApi } from '../../services/api'
import { PERSONAS } from '../../config/personas'

const { Title, Text } = Typography

interface PersonaInfo {
  id: string
  name: string
  role: string
  style: string
  voice: string
  emoji: string
  color: string
}

export default function DigitalHuman() {
  const [personas, setPersonas] = useState<PersonaInfo[]>([])
  const [activePersona, setActivePersona] = useState('')
  const [switching, setSwitching] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await adminApi.getDigitalHumans()
      setPersonas(res.humans || [])
      setActivePersona(res.active || '')
    } catch {
      message.error('无法连接后端服务')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleActivate = async (id: string) => {
    setSwitching(id)
    try {
      const res = await adminApi.updateDigitalHuman(id, {})
      if (res.success) {
        setActivePersona(id)
        message.success(`已切换为「${personas.find((p) => p.id === id)?.name}」`)
      } else {
        message.error(res.error || '切换失败')
      }
    } catch {
      message.error('切换失败，请检查后端服务')
    } finally {
      setSwitching('')
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>
  }

  return (
    <div>
      <Title level={4}>数字人形象管理</Title>
      <p style={{ color: '#888', marginBottom: 24 }}>
        管理灵山导游数字人形象。切换后，游客端3D形象将实时更新。当前语音统一使用妙音的人声。
      </p>

      <Row gutter={[16, 16]}>
        {personas.map((p) => {
          const isActive = p.id === activePersona
          const isSwitching = switching === p.id
          return (
            <Col xs={24} sm={12} md={6} key={p.id}>
              <Card
                hoverable
                style={{
                  border: isActive ? `2px solid ${p.color}` : '1px solid #f0f0f0',
                  transition: 'all 0.3s',
                  position: 'relative',
                }}
                bodyStyle={{ padding: 20, textAlign: 'center' }}
              >
                {/* 活跃标记 */}
                {isActive && (
                  <Tag
                    color="green"
                    style={{ position: 'absolute', top: 8, right: 8, fontSize: 11 }}
                  >
                    <CheckCircleOutlined /> 当前使用
                  </Tag>
                )}

                {/* 头像 */}
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                  {PERSONAS[p.id as keyof typeof PERSONAS]?.image ? (
                    <img
                      src={PERSONAS[p.id as keyof typeof PERSONAS].image}
                      alt={p.name}
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }}
                    />
                  ) : (
                    <span style={{ fontSize: 56, lineHeight: 1 }}>{p.emoji}</span>
                  )}
                </div>

                {/* 名称与角色 */}
                <div style={{
                  fontSize: 18, fontWeight: 700, color: p.color, marginBottom: 4,
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>
                  {p.role}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                  {p.style}
                </div>

                {/* 属性标签 */}
                <Space size={4} wrap style={{ justifyContent: 'center', marginBottom: 16 }}>
                  <Tag style={{ fontSize: 11 }}>🎤 {p.voice.split('-').pop()}</Tag>
                </Space>

                {/* 激活按钮 */}
                <Button
                  type={isActive ? 'default' : 'primary'}
                  icon={<SwapOutlined />}
                  loading={isSwitching}
                  disabled={isActive}
                  onClick={() => handleActivate(p.id)}
                  style={{
                    width: '100%',
                    borderColor: isActive ? p.color : undefined,
                    color: isActive ? p.color : undefined,
                  }}
                >
                  {isActive ? '当前形象' : isSwitching ? '切换中...' : '启用此形象'}
                </Button>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* 说明区域 */}
      <Card
        title="配置说明"
        style={{ marginTop: 24 }}
        bodyStyle={{ fontSize: 13, color: '#666', lineHeight: 2 }}
      >
        <p><strong>外观/服装：</strong>由LAM 3D模型资源包(ZIP)决定，各角色有专属形象。切换即刻生效，游客端iframe自动更新。</p>
        <p><strong>声音：</strong>由OAC服务端配置决定，当前所有角色共用同一TTS语音。如需为不同角色匹配不同声音，需为每个角色单独创建OAC配置文件并重启服务。</p>
        <p><strong>角色属性：</strong>名称、风格描述、emoji等元数据在前端 persona.ts 中定义，后端 admin.py PERSONA_ZIP_MAP 维护角色ID到ZIP文件的映射。</p>
      </Card>
    </div>
  )
}
