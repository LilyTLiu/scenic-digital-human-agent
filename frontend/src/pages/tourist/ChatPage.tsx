import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import DigitalHuman, { Emotion } from '../../components/DigitalHuman'
import { chatApi, voiceApi } from '../../services/api'
import { getPersona } from '../../config/personas'
import { findBestVoice, findFallbackVoice } from '../../utils/voice'

interface ChatMessage {
  role: 'user' | 'ai' | 'error'
  content: string
  timestamp: number  // 序列化友好的时间戳
}

const STORAGE_KEY = 'lingshan_chat_history'

function loadHistory(personaId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${personaId}`)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length > 0) return arr
    }
  } catch { /* ignore */ }
  return []
}

function saveHistory(personaId: string, msgs: ChatMessage[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${personaId}`, JSON.stringify(msgs))
  } catch { /* ignore */ }
}

const EMOTION_PATTERNS: [RegExp, Emotion][] = [
  [/欢迎|您好|很高兴|真棒|太美|壮丽|宏伟|赞叹|震撼|美不胜收|真好|开心|快乐/, 'happy'],
  [/抱歉|遗憾|无法|对不起|请谅解|缺失|暂时没有|目前没有|未收录|没有相关/, 'sad'],
  [/让我想|让我查|请稍等|查阅|看一下|正在查询|思考|分析/, 'thinking'],
  [/哇|竟然|天哪|不可思议|震惊|前所未有|举世瞩目|叹为观止|难以想象|绝无仅有/, 'surprised'],
]
function detectEmotion(text: string): Emotion {
  for (const [p, e] of EMOTION_PATTERNS) { if (p.test(text)) return e }
  return 'neutral'
}

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const persona = getPersona(searchParams.get('persona'))

  const initialQuestion = searchParams.get('q') || ''

  const [messages, setMsg] = useState<ChatMessage[]>(() => {
    const hist = loadHistory(persona.id)
    if (hist.length > 0) return hist
    return [{
      role: 'ai',
      content: `您好！我是灵山胜境的AI导游${persona.name}，擅长${persona.style}的讲解风格。您可以问我灵山大佛的历史与建筑数据、九龙灌浴的故事与表演盛况、梵宫的艺术特色、五印坛城的藏传佛教文化、祥符禅寺的千年历史，或者让我为您推荐游览路线！`,
      timestamp: Date.now(),
    }]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speakingIdx, setSpeakingIdx] = useState(-1) // 正在播放的消息索引，-1=无
  const speaking = speakingIdx >= 0
  const [listening, setListening] = useState(false)
  const [emotion, setEmotion] = useState<Emotion>('happy')
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const personaRef = useRef(persona)
  personaRef.current = persona
  const speakingIdxRef = useRef(-1)

  // 持久化
  useEffect(() => {
    saveHistory(persona.id, messages)
  }, [messages, persona.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // 自动发送 URL 携带的问题
  useEffect(() => {
    if (!initialQuestion) return
    let cancelled = false
    // 延迟确保页面渲染完成
    const timer = setTimeout(() => {
      if (!cancelled) sendMessage(initialQuestion)
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [initialQuestion])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: Date.now() }
    setMsg((p) => [...p, userMsg])
    setInput('')
    setLoading(true)
    setEmotion('thinking')

    try {
      const res = await chatApi.send({ message: text.trim(), scenic_spot: 'lingshan' })
      const reply = res.reply || '抱歉，我暂时无法回答这个问题。'
      setMsg((p) => [...p, { role: 'ai', content: reply, timestamp: Date.now() }])
      setEmotion(detectEmotion(reply))
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || '未知错误'
      let errorMsg = ''
      if (err?.code === 'ERR_NETWORK' || detail.includes('Network Error') || detail.includes('connect')) {
        errorMsg = '无法连接到后端服务，请确认：\n1. 后端已启动: cd backend && python main.py\n2. API Key 已配置: $env:DEEPSEEK_API_KEY="sk-xxx"\n3. 后端地址 http://localhost:8000 可访问'
      } else if (detail.includes('DEEPSEEK_API_KEY') || detail.includes('503') || detail.includes('401')) {
        errorMsg = '后端API Key未配置或无效，请在启动后端时设置：\n$env:DEEPSEEK_API_KEY="sk-xxx"'
      } else {
        errorMsg = `请求失败: ${detail}`
      }
      setMsg((p) => [...p, { role: 'error', content: errorMsg, timestamp: Date.now() }])
      setEmotion('sad')
    } finally {
      setLoading(false)
    }
  }, [loading])

  const startListen = async () => {
    // 检查是否支持麦克风
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMsg((p) => [...p, { role: 'error', content: '当前环境不支持麦克风。请使用文字输入，或使用 HTTPS 访问页面。', timestamp: Date.now() }])
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      r.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      r.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        try {
          const result = await voiceApi.asr(blob)
          if (result.text) await sendMessage(result.text)
          else {
            setMsg((p) => [...p, { role: 'error', content: '未识别到语音内容，请重新录音或使用文字输入。', timestamp: Date.now() }])
            setEmotion('neutral')
          }
        } catch {
          setMsg((p) => [...p, { role: 'error', content: '语音识别失败，请使用文字输入。', timestamp: Date.now() }])
          setEmotion('neutral')
        }
        stream.getTracks().forEach((t) => t.stop())
      }
      r.start()
      setRecorder(r)
      setListening(true)
      setEmotion('thinking')
    } catch (err: any) {
      const name = err?.name || ''
      let tip = ''
      if (name === 'NotAllowedError') {
        tip = '麦克风权限被拒绝。请在浏览器地址栏左侧点击🔒图标 → 允许麦克风访问，然后刷新页面重试。'
      } else if (name === 'NotFoundError') {
        tip = '未检测到麦克风设备。请检查麦克风是否已插入并在系统设置中启用。'
      } else if (name === 'NotReadableError') {
        tip = '麦克风被其他应用占用。请关闭其他可能使用麦克风的程序后重试。'
      } else {
        tip = '无法访问麦克风。请使用文字输入，或检查系统隐私设置中是否允许浏览器使用麦克风。'
      }
      setMsg((p) => [...p, { role: 'error', content: tip, timestamp: Date.now() }])
      setListening(false)
    }
  }

  const stopListen = () => {
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    setListening(false)
    setEmotion('neutral')
  }

  const playIdRef = useRef(0)

  const stopAudio = () => {
    playIdRef.current++
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis.cancel()
    setSpeakingIdx(-1)
    speakingIdxRef.current = -1
  }

  const speak = async (text: string, msgIdx: number) => {
    if (speakingIdxRef.current === msgIdx) { stopAudio(); return }

    playIdRef.current++
    const currentId = playIdRef.current
    speakingIdxRef.current = msgIdx
    setSpeakingIdx(msgIdx)
    setEmotion(detectEmotion(text))

    const voice = findBestVoice(personaRef.current.voice)
    if (voice) {
      const u = new SpeechSynthesisUtterance(text)
      u.voice = voice
      u.lang = 'zh-CN'
      u.rate = 1.05
      u.pitch = 1.0
      u.onend = () => { if (playIdRef.current === currentId) { setSpeakingIdx(-1); speakingIdxRef.current = -1; setEmotion('happy') } }
      u.onerror = () => { if (playIdRef.current === currentId) speakViaEdgeTts(text, currentId, msgIdx) }
      window.speechSynthesis.speak(u)
      return
    }
    speakViaEdgeTts(text, currentId, msgIdx)
  }

  const speakViaEdgeTts = async (text: string, currentId: number, msgIdx: number) => {
    try {
      const ab = await voiceApi.tts(text, personaRef.current.voice)
      if (playIdRef.current !== currentId) return
      const url = URL.createObjectURL(ab)
      const a = new Audio(url)
      audioRef.current = a
      a.onended = () => { if (playIdRef.current === currentId) { setSpeakingIdx(-1); speakingIdxRef.current = -1; setEmotion('happy'); URL.revokeObjectURL(url); audioRef.current = null } }
      a.onerror = () => { if (playIdRef.current === currentId) { setSpeakingIdx(-1); speakingIdxRef.current = -1; setEmotion('neutral'); audioRef.current = null } }
      a.play()
    } catch {
      if (playIdRef.current !== currentId) return
      const fallback = findFallbackVoice()
      const u = new SpeechSynthesisUtterance(text)
      u.voice = fallback
      u.lang = 'zh-CN'; u.rate = 1.0
      u.onend = () => { if (playIdRef.current === currentId) { setSpeakingIdx(-1); speakingIdxRef.current = -1 } }
      window.speechSynthesis.speak(u)
    }
  }

  const clearHistory = () => {
    setMsg([{
      role: 'ai',
      content: `您好！我是灵山胜境的AI导游${persona.name}，擅长${persona.style}的讲解风格。您可以问我灵山大佛的历史与建筑数据、九龙灌浴的故事与表演盛况、梵宫的艺术特色、五印坛城的藏传佛教文化、祥符禅寺的千年历史，或者让我为您推荐游览路线！`,
      timestamp: Date.now(),
    }])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      {/* 数字人头部栏 */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        padding: '10px 14px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 48, height: 48 }}>
          <DigitalHuman
            speaking={speaking}
            emotion={emotion}
            listening={listening}
            size={48}
            visual={persona.visual}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
            AI导游 · {persona.name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 }}>
            {loading ? '正在思考...' : speaking ? '正在讲解...' : listening ? '正在聆听...' : `${persona.style} · 在线`}
          </div>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: loading ? '#f0ad4e' : speaking ? '#5cb85c' : listening ? '#d9534f' : '#4cd964',
          boxShadow: `0 0 6px ${loading ? '#f0ad4e' : speaking ? '#5cb85c' : listening ? '#d9534f' : '#4cd964'}80`,
        }} />
      </div>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', background: '#faf7f2' }}>
        {messages.length > 1 && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <button
              onClick={clearHistory}
              style={{
                padding: '3px 12px', borderRadius: 10, border: '1px solid #e8e3db',
                background: 'transparent', color: '#9c948c', fontSize: 11, cursor: 'pointer',
              }}
            >清除历史记录</button>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}>
            {m.role !== 'user' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: m.role === 'error' ? '#e88b7e' : persona.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, marginRight: 6, flexShrink: 0, marginTop: 2,
                color: '#fff',
              }}>{m.role === 'error' ? '!' : persona.emoji}</div>
            )}
            <div style={{ maxWidth: '82%' }}>
              <div style={{
                padding: '9px 13px',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.role === 'user' ? '#c8963e' : m.role === 'error' ? '#fff5f5' : '#fff',
                color: m.role === 'user' ? '#fff' : m.role === 'error' ? '#d9534f' : '#3d3630',
                fontSize: 13.5, lineHeight: 1.6,
                border: m.role === 'error' ? '1px solid #f8d7da' : 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                whiteSpace: 'pre-wrap',
              }}>
                {m.content || (i === messages.length - 1 && loading && (
                  <span style={{ display: 'flex', gap: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ccc', animation: 'bounce 0.6s ease-in-out infinite' }} />
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ccc', animation: 'bounce 0.6s 0.15s ease-in-out infinite' }} />
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ccc', animation: 'bounce 0.6s 0.3s ease-in-out infinite' }} />
                  </span>
                ))}
              </div>
              {m.role === 'ai' && m.content && (
                <button
                  onClick={() => speak(m.content, i)}
                  style={{
                    marginTop: 3, padding: '3px 8px', borderRadius: 10,
                    border: 'none', background: speakingIdx === i ? '#f8d7da' : 'transparent',
                    color: speakingIdx === i ? '#d9534f' : '#9c948c', fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {speakingIdx === i ? '⏹ 停止' : '🔊 播报'}
                </button>
              )}
              {m.role === 'error' && m.content.includes('API Key') && (
                <button
                  onClick={() => window.open('https://platform.deepseek.com/api_keys', '_blank')}
                  style={{
                    marginTop: 3, padding: '3px 8px', borderRadius: 10,
                    border: 'none', background: 'transparent', color: '#c8963e', fontSize: 11,
                    cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  获取API Key
                </button>
              )}
            </div>
            {m.role === 'user' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#e8e3db', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 15, marginLeft: 6, flexShrink: 0, marginTop: 2,
              }}>👤</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 输入栏 */}
      <div style={{ padding: '8px 12px', background: '#fff', borderTop: '1px solid #f0ebe0' }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <button
            onClick={listening ? stopListen : startListen}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: listening ? '#d9534f' : '#f5f1eb',
              color: listening ? '#fff' : '#9c948c',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
            }}
          >{listening ? '⏹' : '🎤'}</button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? '正在聆听...' : '想问什么都可以...'}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); sendMessage(input)
              }
            }}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              background: '#f5f1eb', borderRadius: 18, padding: '9px 14px',
              fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit', maxHeight: 100,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: loading || !input.trim() ? '#e8e3db' : 'var(--gold)',
              color: loading || !input.trim() ? '#ccc' : '#fff',
              fontSize: 16, cursor: loading || !input.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
              boxShadow: loading || !input.trim() ? 'none' : '0 2px 8px rgba(200,150,62,0.3)',
            }}
          >➤</button>
        </div>
      </div>
    </div>
  )
}
