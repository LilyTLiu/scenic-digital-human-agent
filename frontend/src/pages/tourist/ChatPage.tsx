import { useState, useRef, useEffect } from 'react'
import { Input, Button, Space, Typography, Card, Spin } from 'antd'
import { AudioOutlined, SendOutlined } from '@ant-design/icons'
import { chatApi } from '../../services/api'

const { Text } = Typography

interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: '您好！我是灵山胜境的AI导游。您想了解灵山大佛的历史，还是想知道最佳游览路线？请随时向我提问！',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatApi.send({ message: text, scenic_spot: '灵山胜境' })
      const aiMsg: Message = { role: 'ai', content: res.reply, timestamp: new Date() }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: '抱歉，AI导游暂时无法回复，请稍后再试。',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* 数字人区域 */}
      <Card
        style={{
          flex: '0 0 200px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 0,
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ fontSize: 64 }}>🧑‍💼</div>
        <Text style={{ color: '#fff', fontSize: 16 }}>AI导游 小灵</Text>
        <br />
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          正在为您服务
        </Text>
      </Card>

      {/* 对话区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Card
                size="small"
                style={{
                  maxWidth: '85%',
                  background: msg.role === 'user' ? '#1677ff' : '#f0f0f0',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  borderRadius: 12,
                }}
                bodyStyle={{ padding: '8px 12px' }}
              >
                {msg.content}
              </Card>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: 'center' }}>
              <Spin size="small" /> AI导游思考中...
            </div>
          )}
        </Space>
        <div ref={msgEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8, maxWidth: 600, margin: '0 auto' }}>
          <Button
            icon={<AudioOutlined />}
            type={listening ? 'primary' : 'default'}
            danger={listening}
            onClick={() => setListening(!listening)}
          >
            {listening ? '录音中' : ''}
          </Button>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您想了解的问题..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => sendMessage(input)}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
