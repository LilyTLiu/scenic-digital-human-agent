import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import type { Emotion } from '../../components/DigitalHuman'
import { chatApi, voiceApi, adminApi } from '../../services/api'
import { getPersona, PERSONAS } from '../../config/personas'
import { findBestVoice, findFallbackVoice } from '../../utils/voice'
import { useDigitalHuman } from '../../hooks/useDigitalHuman'

interface ChatMessage {
  role: 'user' | 'ai' | 'error'
  content: string
  timestamp: number
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

// 点赞状态存 Map（消息索引 → 1或-1）
const FeedbackRow = ({ msgIdx, text, speakingIdx, speak, ratings, setRatings }: any) => {
  const r = ratings[msgIdx] || 0
  const doRate = (v: number) => {
    if (ratings[msgIdx]) return
    setRatings((prev: any) => ({ ...prev, [msgIdx]: v }))
    adminApi.submitFeedback(v, text).catch(() => {
      setRatings((prev: any) => { const n = { ...prev }; delete n[msgIdx]; return n })
    })
  }
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
      <button onClick={() => speak(text, msgIdx)} style={{
        padding: '3px 8px', borderRadius: 10, border: 'none',
        background: speakingIdx === msgIdx ? '#f8d7da' : 'transparent',
        color: speakingIdx === msgIdx ? '#d9534f' : '#9c948c', fontSize: 11, cursor: 'pointer',
      }}>{speakingIdx === msgIdx ? '⏹ 停止' : '🔊 播报'}</button>
      <button onClick={() => doRate(1)} style={{
        padding: '2px 6px', borderRadius: 8, border: 'none',
        background: r === 1 ? '#e6ffe6' : 'transparent', color: r === 1 ? '#52c41a' : '#9c948c',
        fontSize: 13, cursor: r ? 'default' : 'pointer',
      }}>👍</button>
      <button onClick={() => doRate(-1)} style={{
        padding: '2px 6px', borderRadius: 8, border: 'none',
        background: r === -1 ? '#fff0f0' : 'transparent', color: r === -1 ? '#ff4d4f' : '#9c948c',
        fontSize: 13, cursor: r ? 'default' : 'pointer',
      }}>👎</button>
    </div>
  )
}

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const persona = getPersona(searchParams.get('persona'))

  const sessionIdRef = useRef(
    (() => {
      const key = `lingshan_session_${persona.id}`
      const stored = localStorage.getItem(key)
      if (stored) return stored
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      localStorage.setItem(key, id)
      return id
    })()
  )

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
  const [speakingIdx, setSpeakingIdx] = useState(-1)
  const speaking = speakingIdx >= 0
  const [listening, setListening] = useState(false)
  const [emotion, setEmotion] = useState<Emotion>('happy')
  const [mouthOpen, setMouthOpen] = useState(0)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const personaRef = useRef(persona)
  personaRef.current = persona
  const speakingIdxRef = useRef(-1)
  const messagesRef = useRef<ChatMessage[]>(messages)
  messagesRef.current = messages
  const streamAbortRef = useRef<AbortController | null>(null)

  // ── 真人模式 ──
  const PERSONA_AVATAR: Record<string, string> = {
    xiaoling: 'companion', xiaoshan: 'custom-xiaoshan-20260709-100204-835',
    miaoyin: 'ancient-beauty', xiaochan: 'custom-chanxiao-20260709-102806-781',
  }
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [realMode, setRealMode] = useState(false)
  const dh = useDigitalHuman(PERSONA_AVATAR[persona.id] || 'ancient-beauty')

  // 切换真人模式时连接/断开 OpenTalking
  const toggleRealMode = useCallback(() => {
    if (realMode) {
      dh.disconnect()
      setRealMode(false)
    } else {
      setRealMode(true)
      if (dh.status === 'idle') dh.connect(PERSONA_AVATAR[persona.id])
    }
  }, [realMode, dh, persona.id])

  useEffect(() => {
    return () => { streamAbortRef.current?.abort() }
  }, [])

  useEffect(() => {
    saveHistory(persona.id, messages)
  }, [messages, persona.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!initialQuestion) return
    let cancelled = false
    const timer = setTimeout(() => {
      if (!cancelled) sendMessage(initialQuestion)
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [initialQuestion])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: Date.now() }
    const aiPlaceholder: ChatMessage = { role: 'ai', content: '', timestamp: Date.now() }
    setMsg((p) => [...p, userMsg, aiPlaceholder])
    setInput('')
    setLoading(true)
    setEmotion('thinking')

    streamAbortRef.current?.abort()

    const accumulator = { text: '' }

    const controller = chatApi.sendStream(
      { message: text.trim(), scenic_spot: 'lingshan', session_id: sessionIdRef.current },
      (token: string) => {
        accumulator.text += token
        const msgs = [...messagesRef.current]
        const last = msgs[msgs.length - 1]
        if (last.role === 'ai') {
          msgs[msgs.length - 1] = { ...last, content: accumulator.text }
        }
        setMsg(msgs)
      },
      // onDone — 景区 RAG 回复后，生成 TTS 音频 → 发给数字人驱动口型
      async () => {
        setEmotion(detectEmotion(accumulator.text))
        setLoading(false)
        if (realMode && accumulator.text) {
          try {
            const audioBlob = await voiceApi.tts(accumulator.text, persona.voice)
            dh.speakAudio(audioBlob)
          } catch (e) { console.error('TTS+speakAudio failed:', e) }
        }
      },
      (err: Error) => {
        const msgs = [...messagesRef.current]
        const detail = err?.message || '未知错误'
        let errorMsg = ''
        if (detail.includes('Network Error') || detail.includes('connect') || detail.includes('fetch')) {
          errorMsg = '无法连接到后端服务，请确认：\n1. 后端已启动: cd backend && python main.py\n2. API Key 已配置\n3. 后端地址 http://localhost:8000 可访问'
        } else if (detail.includes('503') || detail.includes('401') || detail.includes('API Key') || detail.includes('DEEPSEEK')) {
          errorMsg = '后端API Key未配置或无效，请设置：$env:DEEPSEEK_API_KEY="sk-xxx"'
        } else {
          errorMsg = `请求失败: ${detail}`
        }
        if (accumulator.text) {
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulator.text + '\n\n⚠ ' + errorMsg }
        } else {
          msgs[msgs.length - 1] = { role: 'error', content: errorMsg, timestamp: Date.now() }
        }
        setMsg(msgs)
        setEmotion('sad')
        setLoading(false)
      },
    )
    streamAbortRef.current = controller
  }, [loading, realMode, dh])

  const startListen = async () => {
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
    setMouthOpen(0)
  }

  const speak = async (text: string, msgIdx: number) => {
    if (speakingIdxRef.current === msgIdx) { stopAudio(); return }
    playIdRef.current++
    const currentId = playIdRef.current
    speakingIdxRef.current = msgIdx
    setSpeakingIdx(msgIdx)
    setEmotion(detectEmotion(text))
    setMouthOpen(0)

    const voice = findBestVoice(personaRef.current.voice)
    if (voice) {
      const u = new SpeechSynthesisUtterance(text)
      u.voice = voice; u.lang = 'zh-CN'; u.rate = 1.05; u.pitch = 1.0
      const start = Date.now()
      const estimatedDuration = text.length * 280
      const mouthInterval = setInterval(() => {
        if (playIdRef.current !== currentId) { clearInterval(mouthInterval); return }
        const elapsed = Date.now() - start
        if (elapsed > estimatedDuration) { clearInterval(mouthInterval); setMouthOpen(0); return }
        setMouthOpen(0.3 + 0.7 * Math.abs(Math.sin(elapsed / 120)))
      }, 50)
      u.onend = () => {
        clearInterval(mouthInterval)
        if (playIdRef.current === currentId) { setSpeakingIdx(-1); speakingIdxRef.current = -1; setEmotion('happy'); setMouthOpen(0) }
      }
      u.onerror = () => {
        clearInterval(mouthInterval)
        if (playIdRef.current === currentId) speakViaEdgeTts(text, currentId, msgIdx)
      }
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
      a.ontimeupdate = () => {
        if (playIdRef.current !== currentId) return
        setMouthOpen(0.3 + 0.7 * Math.abs(Math.sin(a.currentTime * 14)))
      }
      a.onended = () => {
        if (playIdRef.current === currentId) { setSpeakingIdx(-1); speakingIdxRef.current = -1; setEmotion('happy'); setMouthOpen(0); URL.revokeObjectURL(url); audioRef.current = null }
      }
      a.onerror = () => { if (playIdRef.current === currentId) { setSpeakingIdx(-1); speakingIdxRef.current = -1; setEmotion('neutral'); setMouthOpen(0); audioRef.current = null } }
      a.play()
    } catch {
      if (playIdRef.current !== currentId) return
      const fallback = findFallbackVoice()
      const u = new SpeechSynthesisUtterance(text)
      u.voice = fallback; u.lang = 'zh-CN'; u.rate = 1.0
      u.onend = () => { if (playIdRef.current === currentId) { setSpeakingIdx(-1); speakingIdxRef.current = -1 } }
      window.speechSynthesis.speak(u)
    }
  }

  const clearHistory = () => {
    sessionIdRef.current = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    localStorage.setItem(`lingshan_session_${persona.id}`, sessionIdRef.current)
    setMsg([{
      role: 'ai',
      content: `您好！我是灵山胜境的AI导游${persona.name}，擅长${persona.style}的讲解风格。您可以问我灵山大佛的历史与建筑数据、九龙灌浴的故事与表演盛况、梵宫的艺术特色、五印坛城的藏传佛教文化、祥符禅寺的千年历史，或者让我为您推荐游览路线！`,
      timestamp: Date.now(),
    }])
  }

  // ── 共享头部栏 ──
  const headerBar = (
    <div style={{
      background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
      padding: '10px 14px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* 状态指示灯 — 显示当前导游 emoji */}
      <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: persona.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
        {persona.emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>AI导游 · {persona.name}</span>
          <select
            value={persona.id}
            onChange={(e) => navigate(`/tourist/chat?persona=${e.target.value}`, { replace: true })}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6, color: '#fff', fontSize: 11, padding: '1px 4px', cursor: 'pointer',
            }}
          >
            {Object.values(PERSONAS).map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#1a1a2e', color: '#fff' }}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 }}>
          {realMode && dh.status === 'connecting' ? '⏳ 数字人连接中...' :
           realMode && dh.status === 'error' ? '⚠ 数字人离线' :
           realMode && dh.status === 'live' ? '🟢 真人模式' :
           loading ? '正在思考...' : speaking ? '正在讲解...' : listening ? '正在聆听...' : `${persona.style} · 在线`}
        </div>
      </div>
      {/* 真人模式开关 */}
      <button onClick={toggleRealMode} style={{
        padding: '5px 14px', borderRadius: 16,
        border: 'none',
        background: realMode
          ? 'linear-gradient(135deg, #5cb85c, #3d8b40)'
          : 'rgba(255,255,255,0.1)',
        color: '#fff', fontSize: 12, fontWeight: realMode ? 600 : 400,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 0.2s',
        boxShadow: realMode ? '0 0 12px rgba(92,184,92,0.3)' : 'none',
      }}>
        {realMode ? '● 真人模式' : '○ 真人模式'}
      </button>
      {realMode && dh.status === 'error' && (
        <button onClick={() => dh.connect()} style={{
          padding: '4px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)',
          background: 'transparent', color: '#f0ad4e', fontSize: 10, cursor: 'pointer',
        }}>重连</button>
      )}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: loading ? '#f0ad4e' : speaking ? '#5cb85c' : listening ? '#d9534f' : '#4cd964',
        boxShadow: `0 0 6px ${loading ? '#f0ad4e' : speaking ? '#5cb85c' : listening ? '#d9534f' : '#4cd964'}80`,
      }} />
    </div>
  )

  // ── 聊天区域 ──
  const chatArea = (
    <>
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', background: '#faf7f2' }}>
        {messages.length > 1 && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <button onClick={clearHistory} style={{
              padding: '3px 12px', borderRadius: 10, border: '1px solid #e8e3db',
              background: 'transparent', color: '#9c948c', fontSize: 11, cursor: 'pointer',
            }}>清除历史记录</button>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'msg-user-in' : 'msg-ai-in'} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {m.role !== 'user' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: m.role === 'error' ? '#e88b7e' : persona.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, marginRight: 6, flexShrink: 0, marginTop: 2, color: '#fff',
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
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'pre-wrap',
              }}>
                {m.content || (i === messages.length - 1 && loading && (
                  <span style={{ display: 'flex', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8963e', animation: 'typingDot 1.2s ease-in-out infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8963e', animation: 'typingDot 1.2s 0.2s ease-in-out infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8963e', animation: 'typingDot 1.2s 0.4s ease-in-out infinite' }} />
                  </span>
                ))}
              </div>
              {m.role === 'ai' && m.content && !realMode && (
                <FeedbackRow msgIdx={i} text={m.content}
                  speakingIdx={speakingIdx} speak={speak}
                  ratings={ratings} setRatings={setRatings} />
              )}
            </div>
            {m.role === 'user' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#e8e3db',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, marginLeft: 6, flexShrink: 0, marginTop: 2,
              }}>👤</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 输入栏 */}
      <div className="glass" style={{ padding: '8px 12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <button onClick={listening ? stopListen : startListen} style={{
            width: 38, height: 38, borderRadius: '50%', border: 'none',
            background: listening ? '#d9534f' : '#f5f1eb',
            color: listening ? '#fff' : '#9c948c', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}>{listening ? '⏹' : '🎤'}</button>
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? '正在聆听...' : '想问什么都可以...'}
            rows={1}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              background: '#f5f1eb', borderRadius: 18, padding: '9px 14px',
              fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit', maxHeight: 100,
            }}
          />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{
            width: 38, height: 38, borderRadius: '50%', border: 'none',
            background: loading || !input.trim() ? '#e8e3db' : 'var(--gold)',
            color: loading || !input.trim() ? '#ccc' : '#fff', fontSize: 16,
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
            boxShadow: loading || !input.trim() ? 'none' : '0 2px 8px rgba(200,150,62,0.3)',
          }}>➤</button>
        </div>
      </div>
    </>
  )

  // ── 真人模式：左上角浮动视频 + 全屏聊天 ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', position: 'relative' }}>
      {headerBar}

      {/* 真人模式 — 左上角浮动数字人 */}
      {realMode && dh.status === 'live' && (
        <div style={{
          position: 'absolute', top: 8, left: 12, zIndex: 50,
          width: 140, borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
          background: '#000',
        }}>
          <video
            ref={dh.videoRef}
            style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
            playsInline
          />
          <div style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 100%)',
            padding: '3px 8px', fontSize: 10, color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
          }}>
            {persona.name} · 真人导游
          </div>
        </div>
      )}

      {chatArea}
    </div>
  )
}
