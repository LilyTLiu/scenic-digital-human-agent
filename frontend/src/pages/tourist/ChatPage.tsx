import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { chatApi, voiceApi, adminApi } from '../../services/api'
import { useXmovAvatar } from '../../hooks/useXmovAvatar'
import { getSupportedAudioMimeType, normalizeScenicQuestion } from '../../utils/asr'
import { useTouristLayoutMode } from './Layout'
import { getXmovAvatarProfile, XMOV_AVATAR_PROFILES, XMOV_AVATAR_STORAGE_KEY } from '../../config/xmovAvatars'

interface ChatMessage {
  role: 'user' | 'ai' | 'error'
  content: string
  timestamp: number
}

type ViewMode = 'avatar' | 'dialog'

const STORAGE_KEY = 'lingshan_unified_guide_history'
const SESSION_KEY = 'lingshan_unified_guide_session'
const XIAOXIAO_VOICE = 'zh-CN-XiaoxiaoNeural'
const DESKTOP_QUICK_QUESTIONS = [
  '灵山大佛有多高？',
  '梵宫有什么建筑特色？',
  '九龙灌浴几点开始？',
  '推荐一条半日游路线',
]
const INPUT_QUICK_QUESTIONS = [
  { label: '购票相关', question: '请介绍一下灵山胜境的票价、购票方式和优惠政策。' },
  { label: '演出活动相关', question: '请介绍一下灵山胜境的演出活动、开放时间和推荐观看安排。' },
  { label: '服务设施相关', question: '请介绍一下灵山胜境的服务设施，比如停车、餐饮、卫生间和游客中心。' },
  { label: '住宿相关', question: '请介绍一下灵山胜境及周边的住宿相关信息。' },
]

function createSessionId() {
  return `guide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createGreeting(): ChatMessage {
  return {
    role: 'ai',
    content: '您好！我是灵山胜境 AI 导游。您可以用文字或语音向我提问，例如灵山大佛、九龙灌浴、梵宫、五印坛城、祥符禅寺和游览路线。',
    timestamp: Date.now(),
  }
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return [createGreeting()]
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)))
  } catch { /* ignore */ }
}

function getSessionId() {
  const stored = localStorage.getItem(SESSION_KEY)
  if (stored) return stored
  const id = createSessionId()
  localStorage.setItem(SESSION_KEY, id)
  return id
}

function hideAvatarTextOverlays(container: HTMLElement) {
  if (!container.querySelector('canvas, video, img, svg')) return

  const nodes = container.querySelectorAll<HTMLElement>('*')
  nodes.forEach((node) => {
    const tag = node.tagName.toLowerCase()
    if (['canvas', 'video', 'img', 'svg', 'path'].includes(tag)) {
      node.style.display = ''
      return
    }
    if (node.querySelector('canvas, video, img, svg')) {
      if (node.style.display === 'none') node.style.display = ''
      return
    }
    if (!node.textContent?.trim()) return
    node.style.display = 'none'
  })
}

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const initialQuestion = searchParams.get('q') || ''
  const [selectedAvatarKey, setSelectedAvatarKey] = useState(() => {
    try {
      return getXmovAvatarProfile(localStorage.getItem(XMOV_AVATAR_STORAGE_KEY)).key
    } catch {
      return XMOV_AVATAR_PROFILES[0].key
    }
  })
  const selectedAvatar = useMemo(() => getXmovAvatarProfile(selectedAvatarKey), [selectedAvatarKey])
  const xmov = useXmovAvatar({
    appId: selectedAvatar.appId,
    appSecret: selectedAvatar.appSecret,
  })
  const { isDesktop } = useTouristLayoutMode()

  const [viewMode, setViewMode] = useState<ViewMode>('avatar')
  const [fullTextVisible, setFullTextVisible] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speakingIdx, setSpeakingIdx] = useState(-1)
  const [ratings, setRatings] = useState<Record<number, number>>({})

  const bottomRef = useRef<HTMLDivElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef(messages)
  const sessionIdRef = useRef(getSessionId())
  const initialSentRef = useRef(false)
  const playIdRef = useRef(0)

  messagesRef.current = messages

  const avatarConnected = xmov.status === 'live' || xmov.status === 'speaking'
  const avatarBusy = xmov.status === 'loading-sdk' || xmov.status === 'initializing'
  const avatarSpeaking = xmov.status === 'speaking'
  const inputDisabled = loading || listening

  useEffect(() => {
    try {
      localStorage.setItem(XMOV_AVATAR_STORAGE_KEY, selectedAvatar.key)
    } catch { /* ignore */ }
  }, [selectedAvatar.key])

  const latestAiText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'ai' && messages[i].content.trim()) return messages[i].content
    }
    return ''
  }, [messages])

  useEffect(() => {
    saveHistory(messages)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, viewMode])

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const container = document.getElementById(xmov.containerId)
    if (!container) return

    hideAvatarTextOverlays(container)
    const observer = new MutationObserver(() => hideAvatarTextOverlays(container))
    observer.observe(container, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [xmov.containerId])

  useEffect(() => {
    if (!isDesktop || (xmov.status !== 'live' && xmov.status !== 'speaking')) return

    const resizeTimers = [
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 80),
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 420),
    ]
    return () => resizeTimers.forEach((timer) => window.clearTimeout(timer))
  }, [isDesktop, xmov.status])

  const stopAudio = useCallback(() => {
    playIdRef.current += 1
    audioRef.current?.pause()
    audioRef.current = null
    setSpeakingIdx(-1)
  }, [])

  const stopAvatarSpeaking = useCallback(() => {
    xmov.stopSpeaking()
  }, [xmov])

  const speakWithXiaoxiao = useCallback(async (text: string, msgIdx: number) => {
    if (speakingIdx === msgIdx) {
      stopAudio()
      return
    }

    stopAudio()
    const playId = playIdRef.current
    setSpeakingIdx(msgIdx)
    try {
      const audioBlob = await voiceApi.tts(text, XIAOXIAO_VOICE)
      if (playIdRef.current !== playId) return
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        if (playIdRef.current === playId) setSpeakingIdx(-1)
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        if (playIdRef.current === playId) setSpeakingIdx(-1)
      }
      await audio.play()
    } catch (err) {
      console.error('[ChatPage] Xiaoxiao TTS failed:', err)
      if (playIdRef.current === playId) setSpeakingIdx(-1)
    }
  }, [speakingIdx, stopAudio])

  const submitFeedback = (msgIdx: number, rating: number, text: string) => {
    if (ratings[msgIdx]) return
    setRatings((prev) => ({ ...prev, [msgIdx]: rating }))
    adminApi.submitFeedback(rating, text).catch(() => {
      setRatings((prev) => {
        const next = { ...prev }
        delete next[msgIdx]
        return next
      })
    })
  }

  const sendMessage = useCallback(async (rawText: string) => {
    const question = normalizeScenicQuestion(rawText)
    if (!question || loading) return

    stopAudio()
    if (avatarSpeaking) stopAvatarSpeaking()
    streamAbortRef.current?.abort()
    setInput('')
    setLoading(true)
    setFullTextVisible(true)

    const userMsg: ChatMessage = { role: 'user', content: question, timestamp: Date.now() }
    const aiPlaceholder: ChatMessage = { role: 'ai', content: '', timestamp: Date.now() }
    setMessages((prev) => [...prev, userMsg, aiPlaceholder])

    const accumulator = { text: '' }
    let doneHandled = false

    const finish = async () => {
      if (doneHandled) return
      doneHandled = true
      setLoading(false)
      const reply = accumulator.text.trim()
      if (reply && avatarConnected) {
        await xmov.speak(reply)
      }
    }

    const controller = chatApi.sendStream(
      { message: question, scenic_spot: 'lingshan', session_id: sessionIdRef.current },
      (token) => {
        accumulator.text += token
        const next = [...messagesRef.current]
        const last = next[next.length - 1]
        if (last?.role === 'ai') {
          next[next.length - 1] = { ...last, content: accumulator.text }
          setMessages(next)
        }
      },
      () => { void finish() },
      (err) => {
        const detail = err?.message || '未知错误'
        const errorMsg = detail.includes('Network Error') || detail.includes('fetch')
          ? '无法连接到后端服务，请确认后端已启动并可访问 http://localhost:8000。'
          : `请求失败：${detail}`
        const next = [...messagesRef.current]
        if (accumulator.text && next[next.length - 1]?.role === 'ai') {
          next[next.length - 1] = { ...next[next.length - 1], content: `${accumulator.text}\n\n${errorMsg}` }
        } else {
          next[next.length - 1] = { role: 'error', content: errorMsg, timestamp: Date.now() }
        }
        setMessages(next)
        setLoading(false)
      },
    )
    streamAbortRef.current = controller
  }, [avatarConnected, avatarSpeaking, loading, stopAudio, stopAvatarSpeaking, xmov])

  useEffect(() => {
    if (!initialQuestion || initialSentRef.current) return
    initialSentRef.current = true
    const timer = window.setTimeout(() => { void sendMessage(initialQuestion) }, 300)
    return () => window.clearTimeout(timer)
  }, [initialQuestion, sendMessage])

  const startListen = async () => {
    if (!navigator.mediaDevices?.getUserMedia || inputDisabled) {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessages((prev) => [...prev, {
          role: 'error',
          content: '当前环境不支持麦克风。请使用文字输入，或使用 HTTPS 访问页面。',
          timestamp: Date.now(),
        }])
      }
      return
    }

    if (avatarSpeaking) stopAvatarSpeaking()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedAudioMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        setListening(false)
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        try {
          const result = await voiceApi.asr(blob)
          const question = normalizeScenicQuestion(result.text || '')
          if (question) {
            await sendMessage(question)
          } else {
            setMessages((prev) => [...prev, {
              role: 'error',
              content: '未识别到语音内容，请重新录音或使用文字输入。',
              timestamp: Date.now(),
            }])
          }
        } catch (err) {
          console.error('[ChatPage] ASR failed:', err)
          setMessages((prev) => [...prev, {
            role: 'error',
            content: '语音识别失败，请使用文字输入。',
            timestamp: Date.now(),
          }])
        } finally {
          stream.getTracks().forEach((track) => track.stop())
        }
      }
      recorder.start()
      recorderRef.current = recorder
      setListening(true)
    } catch (err: any) {
      const name = err?.name || ''
      const tip = name === 'NotAllowedError'
        ? '麦克风权限被拒绝。请在浏览器地址栏左侧允许麦克风访问，然后刷新页面重试。'
        : name === 'NotFoundError'
          ? '未检测到麦克风设备。请检查麦克风是否已插入并在系统设置中启用。'
          : '无法访问麦克风。请使用文字输入，或检查系统隐私设置。'
      setMessages((prev) => [...prev, { role: 'error', content: tip, timestamp: Date.now() }])
    }
  }

  const stopListen = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setListening(false)
  }

  const clearHistory = () => {
    const sessionId = createSessionId()
    sessionIdRef.current = sessionId
    localStorage.setItem(SESSION_KEY, sessionId)
    localStorage.removeItem(STORAGE_KEY)
    setRatings({})
    setMessages([createGreeting()])
  }

  const connectAvatar = async () => {
    await xmov.connect()
  }

  const disconnectAvatar = async () => {
    await xmov.disconnect()
  }

  const selectAvatar = async (avatarKey: string) => {
    if (avatarKey === selectedAvatar.key || avatarBusy) return
    stopAudio()
    if (avatarSpeaking) stopAvatarSpeaking()
    if (avatarConnected || xmov.status === 'error') await xmov.disconnect()
    setSelectedAvatarKey(getXmovAvatarProfile(avatarKey).key)
    setFullTextVisible(true)
  }

  const avatarStatusText = (() => {
    if (!xmov.configured) return `${selectedAvatar.name} 未配置`
    if (xmov.status === 'idle') return '数字人未连接'
    if (xmov.status === 'loading-sdk') return '数字人连接中'
    if (xmov.status === 'initializing') return '数字人连接中'
    if (xmov.status === 'speaking') return '数字人正在讲解'
    if (xmov.status === 'error') return xmov.error ? '数字人连接失败' : '数字人连接失败'
    return '数字人在线'
  })()

  const avatarSelector = (
    <div
      className="tourist-chat-avatar-selector"
      aria-label="选择数字人"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="tourist-chat-avatar-selector-label">数字人</span>
      <div className="tourist-chat-avatar-options">
        {XMOV_AVATAR_PROFILES.map((profile) => {
          const active = profile.key === selectedAvatar.key
          const configured = Boolean(profile.appId && profile.appSecret)
          return (
            <button
              key={profile.key}
              type="button"
              className={[
                'tourist-chat-avatar-option',
                active ? 'active' : '',
                configured ? '' : 'missing',
              ].filter(Boolean).join(' ')}
              onClick={() => void selectAvatar(profile.key)}
              disabled={avatarBusy}
              title={configured ? profile.name : '未配置应用参数'}
            >
              <span aria-hidden="true" />
              {profile.name}
            </button>
          )
        })}
      </div>
    </div>
  )

  const inputBar = (
    <div
      className="glass tourist-chat-input"
      onClick={(event) => event.stopPropagation()}
      style={{
        padding: '9px 12px',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        background: viewMode === 'avatar' ? 'rgba(255,255,255,0.9)' : undefined,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <button
          onClick={listening ? stopListen : startListen}
          disabled={loading}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: listening ? '#d9534f' : '#f5f1eb',
            color: listening ? '#fff' : '#7d7368',
            fontSize: 14,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.55 : 1,
            flexShrink: 0,
          }}
          aria-label={listening ? '停止录音' : '开始录音'}
        >
          {listening ? '停' : '麦'}
        </button>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={listening ? '正在聆听...' : '向灵山导游提问'}
          rows={1}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void sendMessage(input)
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: '#f5f1eb',
            borderRadius: 18,
            padding: '10px 14px',
            fontSize: 14,
            lineHeight: 1.45,
            fontFamily: 'inherit',
            maxHeight: 96,
          }}
        />
        <button
          onClick={() => void sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: loading || !input.trim() ? '#e8e3db' : '#c8963e',
            color: loading || !input.trim() ? '#bbb' : '#fff',
            fontSize: 14,
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            flexShrink: 0,
          }}
          aria-label="发送"
        >
          送
        </button>
      </div>
      <div className="tourist-chat-input-quick-row" aria-label="快捷问答">
        {INPUT_QUICK_QUESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => void sendMessage(item.question)}
            disabled={inputDisabled}
            title={item.question}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )

  const dialogMessages = (
    <div className="tourist-chat-messages" style={{ overflow: 'auto', padding: '12px 14px', minHeight: 0 }}>
      {messages.length > 1 && !isDesktop && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <button
            onClick={clearHistory}
            style={{
              padding: '4px 12px',
              borderRadius: 12,
              border: '1px solid #e5ded2',
              background: '#fff',
              color: '#9c948c',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            清除历史记录
          </button>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={`${message.timestamp}-${index}`}
          style={{
            display: 'flex',
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}
        >
      <div style={{ maxWidth: '84%', minWidth: 0 }}>
            <div style={{
              padding: '10px 13px',
              borderRadius: message.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: message.role === 'user' ? '#c8963e' : message.role === 'error' ? '#fff5f5' : '#fff',
              color: message.role === 'user' ? '#fff' : message.role === 'error' ? '#d9534f' : '#3d3630',
              fontSize: 14,
              lineHeight: 1.6,
              border: message.role === 'error' ? '1px solid #f8d7da' : '1px solid rgba(0,0,0,0.03)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}>
              {message.content || (index === messages.length - 1 && loading ? '正在思考...' : '')}
            </div>
            {message.role === 'ai' && message.content && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  onClick={() => void speakWithXiaoxiao(message.content, index)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 10,
                    border: 'none',
                    background: speakingIdx === index ? '#f8d7da' : 'transparent',
                    color: speakingIdx === index ? '#d9534f' : '#9c948c',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {speakingIdx === index ? '停止' : '播报'}
                </button>
                <button
                  onClick={() => submitFeedback(index, 1, message.content)}
                  style={{
                    padding: '3px 7px',
                    borderRadius: 9,
                    border: 'none',
                    background: ratings[index] === 1 ? '#e6ffe6' : 'transparent',
                    color: ratings[index] === 1 ? '#52c41a' : '#9c948c',
                    fontSize: 12,
                    cursor: ratings[index] ? 'default' : 'pointer',
                  }}
                >
                  赞
                </button>
                <button
                  onClick={() => submitFeedback(index, -1, message.content)}
                  style={{
                    padding: '3px 7px',
                    borderRadius: 9,
                    border: 'none',
                    background: ratings[index] === -1 ? '#fff0f0' : 'transparent',
                    color: ratings[index] === -1 ? '#ff4d4f' : '#9c948c',
                    fontSize: 12,
                    cursor: ratings[index] ? 'default' : 'pointer',
                  }}
                >
                  踩
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )

  if (isDesktop) {
    return (
      <div className="tourist-chat-shell tourist-chat-desktop">
        <div className="tourist-chat-desktop-panel">
          <section className="tourist-chat-desktop-dialog" aria-label="数字人问答">
            <header className="tourist-chat-desktop-header">
              <div>
                <h1 className="tourist-chat-title-line">
                  <span>灵山胜境智能问答</span>
                </h1>
              </div>
              <div className="tourist-chat-desktop-tools">
                <button type="button" onClick={clearHistory}>清空记录</button>
                {(avatarSpeaking || speakingIdx >= 0) && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      stopAvatarSpeaking()
                      stopAudio()
                    }}
                  >
                    停止播报
                  </button>
                )}
              </div>
            </header>

            <div className="tourist-chat-quick-row" aria-label="推荐问题">
              {DESKTOP_QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendMessage(question)}
                  disabled={inputDisabled}
                >
                  {question}
                </button>
              ))}
            </div>

            {dialogMessages}
            {inputBar}
          </section>

          <aside className="tourist-chat-desktop-avatar" aria-label="数字人">
            <div className="tourist-chat-avatar-actions">
              {xmov.configured && !avatarConnected && !avatarBusy && (
                <button type="button" onClick={() => void connectAvatar()}>
                  {xmov.status === 'error' ? '重连数字人' : '连接数字人'}
                </button>
              )}
              {xmov.configured && (avatarConnected || avatarBusy) && (
                <button type="button" className="danger" onClick={() => void disconnectAvatar()}>
                  结束对话
                </button>
              )}
            </div>
            <div className="tourist-chat-avatar-status-pill">
              <span className={avatarConnected ? 'online' : avatarBusy ? 'busy' : ''} />
              {avatarStatusText}
            </div>
            <div className="tourist-chat-avatar-stage">
              <div id={xmov.containerId} className="tourist-chat-avatar-canvas" />
              {(!avatarConnected && !avatarBusy) && (
                <div className="tourist-chat-standby-avatar" aria-hidden="true">
                  <img
                    className="tourist-chat-standby-image"
                    src={selectedAvatar.standbyImage}
                    alt=""
                    draggable={false}
                  />
                </div>
              )}
              {(!xmov.configured || xmov.status === 'idle' || xmov.status === 'error') && (
                <div className="tourist-chat-avatar-placeholder">
                  <strong>数字人待机中</strong>
                  <span>
                    {xmov.configured
                      ? '连接后可由数字人同步讲解，左侧仍可直接进行文字或语音问答。'
                      : '请先配置数字人应用参数，左侧问答功能可继续使用。'}
                  </span>
                </div>
              )}
            </div>
            <div className="tourist-chat-avatar-bottom">
              {avatarSelector}
            </div>
          </aside>
        </div>
      </div>
    )
  }

  if (viewMode === 'dialog') {
    return (
      <div className="tourist-chat-shell tourist-chat-dialog" style={{
        height: 'calc(100vh - 60px)',
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr auto',
        background: '#f7f4ef',
        overflow: 'hidden',
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 14px',
          background: '#1a1a2e',
          color: '#fff',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>对话框</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', marginTop: 2 }}>
              文字和语音问答记录
            </div>
          </div>
          <button
            onClick={() => setViewMode('avatar')}
            style={{
              border: '1px solid rgba(255,255,255,0.22)',
              background: '#c8963e',
              color: '#fff',
              borderRadius: 16,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            数字人
          </button>
        </header>
        <div className="tourist-chat-dialog-avatar-picker">
          {avatarSelector}
        </div>
        {dialogMessages}
        {inputBar}
      </div>
    )
  }

  return (
    <div
      className="tourist-chat-shell tourist-chat-avatar"
      onClick={() => setFullTextVisible((visible) => !visible)}
      style={{
        height: 'calc(100vh - 60px)',
        position: 'relative',
        overflow: 'hidden',
        background: '#050505',
        color: '#fff',
      }}
    >
      <div
        id={xmov.containerId}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 18%, #1d2e29 0%, #050505 62%)',
        }}
      />
      {(!avatarConnected && !avatarBusy) && (
        <img
          className="tourist-chat-mobile-standby-image"
          src={selectedAvatar.standbyImage}
          alt=""
          draggable={false}
        />
      )}

      {(!xmov.configured || xmov.status === 'idle' || xmov.status === 'error') && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: avatarConnected ? 'transparent' : 'rgba(0,0,0,0.42)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 'min(520px, 92%)',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.86)',
            lineHeight: 1.7,
            fontSize: 13,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>灵山胜境 AI 数字导游</div>
            <div>{xmov.configured ? '点击连接数字人，也可以直接使用下方文字或语音问答。' : '请先配置数字人应用参数；下方文字和语音问答仍可正常使用。'}</div>
          </div>
        </div>
      )}

      <header
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0))',
        }}
      >
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: avatarConnected ? '#4cd964' : avatarBusy ? '#f0ad4e' : '#9c948c',
          boxShadow: '0 0 12px currentColor',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>数字人</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)', marginTop: 2 }}>
            {avatarStatusText}
          </div>
        </div>
        {xmov.configured && !avatarConnected && !avatarBusy && (
          <button
            onClick={() => void connectAvatar()}
            style={{
              border: '1px solid rgba(255,255,255,0.22)',
              background: xmov.status === 'error' ? 'rgba(255,255,255,0.1)' : '#c8963e',
              color: '#fff',
              borderRadius: 16,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {xmov.status === 'error' ? '重连' : '连接'}
          </button>
        )}
        {xmov.configured && (avatarConnected || avatarBusy) && (
          <button
            onClick={() => void disconnectAvatar()}
            style={{
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(217,83,79,0.86)',
              color: '#fff',
              borderRadius: 16,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            结束
          </button>
        )}
        <button
          onClick={() => setViewMode('dialog')}
          style={{
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            borderRadius: 16,
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          对话框
        </button>
      </header>

      {avatarSpeaking && (
        <button
          onClick={(event) => {
            event.stopPropagation()
            stopAvatarSpeaking()
          }}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: fullTextVisible ? 238 : 136,
            transform: 'translateX(-50%)',
            zIndex: 6,
            border: 'none',
            borderRadius: 18,
            padding: '8px 18px',
            background: 'rgba(217,83,79,0.94)',
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
          }}
        >
          停止播报
        </button>
      )}

      {fullTextVisible && (
        <div
          className="tourist-chat-avatar-text"
          onClick={(event) => event.stopPropagation()}
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 132,
            zIndex: 4,
            maxHeight: '34vh',
            overflow: 'auto',
            borderRadius: 8,
            padding: '12px 14px',
            background: 'rgba(0,0,0,0.58)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.94)',
            fontSize: 14,
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            boxShadow: '0 10px 34px rgba(0,0,0,0.28)',
          }}
        >
          {loading ? (latestAiText || '正在思考...') : latestAiText}
        </div>
      )}

      <div className="tourist-chat-mobile-bottom">
        {avatarSelector}
        {inputBar}
      </div>
    </div>
  )
}
