import { useState, useEffect, useRef, useCallback } from 'react'
import { useDigitalHuman } from '../../hooks/useDigitalHuman'
import { chatApi, voiceApi } from '../../services/api'
import { PERSONAS, type PersonaId } from '../../config/personas'

const PERSONA_LIST = Object.values(PERSONAS)

// 导游 → OpenTalking 形象映射
const PERSONA_AVATAR: Record<string, string> = {
  xiaoling: 'companion',       // 小灵 → 陪伴
  xiaoshan: 'custom-xiaoshan-20260709-100204-835',  // 小山自定义
  miaoyin: 'ancient-beauty',                         // 妙音 → 古装美女
  xiaochan: 'custom-chanxiao-20260709-102806-781',  // 小禅自定义
}

export default function RealHumanPage() {
  const dh = useDigitalHuman(PERSONA_AVATAR['miaoyin'])
  const [personaId, setPersonaId] = useState<PersonaId>('miaoyin')
  const persona = PERSONAS[personaId]
  const [listening, setListening] = useState(false)
  const [subtitle, setSubtitle] = useState('')
  const [statusText, setStatusText] = useState('点击麦克风开始对话')
  const [replying, setReplying] = useState(false)

  // 切换角色 → 切换数字人形象
  const switchPersona = (id: PersonaId) => {
    setPersonaId(id)
    const avatarId = PERSONA_AVATAR[id] || 'ancient-beauty'
    dh.disconnect()
    setTimeout(() => dh.connect(avatarId), 300)
  }
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const typewriterRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => { if (dh.status === 'idle') dh.connect() }, [dh.status])
  useEffect(() => {
    if (dh.status === 'connecting') setStatusText('数字人连接中...')
    else if (dh.status === 'error') setStatusText('连接失败，点击重连')
  }, [dh.status])

  // 打字机效果 — 保留最近两行，自动上滚
  const typewrite = useCallback((text: string, audioBlob?: Blob) => {
    let i = 0
    const fullText = text
    setSubtitle('')
    clearInterval(typewriterRef.current)

    const startTypewriter = (durationMs: number) => {
      const speed = Math.max(60, durationMs / fullText.length)
      typewriterRef.current = setInterval(() => {
        i++
        // 取最后两行（按句号/换行切分后取末尾）
        const shown = fullText.slice(0, i)
        const lines = shown.split(/[。\n]/).filter(Boolean)
        const lastTwo = lines.slice(-2).join('。')
        setSubtitle(lastTwo || shown)
        if (i >= fullText.length) clearInterval(typewriterRef.current)
      }, speed)
    }

    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob))
      audio.addEventListener('loadedmetadata', () => {
        startTypewriter(audio.duration * 1000)
      })
    } else {
      startTypewriter(fullText.length * 250)
    }
  }, [])

  const sendToAI = useCallback(async (text: string) => {
    try {
      setReplying(true)
      setStatusText('思考中...')
      const res = await chatApi.send({ message: text, scenic_spot: '灵山胜境' })
      const reply = res.reply || ''
      setStatusText('')
      // TTS → 数字人口型 + 字幕同步
      try {
        const audioBlob = await voiceApi.tts(reply, persona.voice)
        // 先发音频给数字人引擎（GPU 处理需约 800ms）
        dh.speakAudio(audioBlob)
        // 等待管线延迟后开始字幕，确保口型同步
        const PIPELINE_DELAY = 900
        await new Promise(r => setTimeout(r, PIPELINE_DELAY))
        typewrite(reply, audioBlob)
      } catch {
        typewrite(reply)
      }
      setReplying(false)
    } catch {
      typewrite('抱歉，我暂时无法回答')
      setReplying(false)
    }
  }, [dh, typewrite])

  const startListen = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      r.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      r.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setStatusText('识别中...')
        try {
          const result = await voiceApi.asr(blob)
          if (result.text) {
            setSubtitle(result.text)
            await sendToAI(result.text)
          } else {
            setStatusText('未识别到语音')
          }
        } catch {
          setStatusText('识别失败')
        }
        stream.getTracks().forEach((t) => t.stop())
      }
      r.start()
      recorderRef.current = r
      setListening(true)
      setStatusText('聆听中...')
      setSubtitle('')
    } catch {
      setStatusText('麦克风权限被拒绝')
    }
  }

  const stopListen = () => {
    recorderRef.current?.stop()
    setListening(false)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)',
      background: '#000', position: 'relative', overflow: 'hidden',
    }}>
      {/* 全屏视频 + 呼吸灯边框 */}
      {dh.status === 'live' && (
        <div className="breathing-border" style={{
          position: 'absolute', inset: 8, borderRadius: 20, overflow: 'hidden',
        }}>
          <video ref={dh.videoRef} style={{
            width: '100%', height: '100%', objectFit: 'cover',
          }} playsInline />
        </div>
      )}

      {/* 未连接遮罩 */}
      {dh.status !== 'live' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)',
        }}>
          <span style={{ fontSize: 64, marginBottom: 16 }}>
            {dh.status === 'connecting' ? '⏳' : dh.status === 'error' ? '⚠️' : '👩‍🦰'}
          </span>
          <div style={{ color: '#fff', fontSize: 16 }}>
            {dh.status === 'connecting' ? '正在连接数字人引擎...' :
             dh.status === 'error' ? dh.error || '连接失败' : '准备中'}
          </div>
          {dh.status === 'error' && (
            <button onClick={() => dh.connect()} style={{
              marginTop: 16, padding: '8px 24px', borderRadius: 20,
              border: '1px solid #f0ad4e', background: 'transparent',
              color: '#f0ad4e', fontSize: 14, cursor: 'pointer',
            }}>重新连接</button>
          )}
        </div>
      )}

      {/* 顶部状态 + 角色切换 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '12px 16px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: dh.status === 'live' ? '#4cd964' : listening ? '#d9534f' : '#f0ad4e',
        }} />
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, flex: 1 }}>
          {persona.emoji} {persona.name} · {persona.style}
        </span>
        {/* 角色切换 */}
        <div style={{ display: 'flex', gap: 4 }}>
          {PERSONA_LIST.map((p) => (
            <button key={p.id} onClick={() => switchPersona(p.id)} style={{
              padding: '3px 8px', borderRadius: 10, border: 'none',
              background: personaId === p.id ? 'rgba(200,150,62,0.6)' : 'rgba(255,255,255,0.1)',
              color: personaId === p.id ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 底部区域：字幕 + 麦克风 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '16px 16px 28px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        {/* 字幕 — 打字机效果，仅占小区域 */}
        <div className="glass-dark" style={{
          width: '100%', maxWidth: 480, minHeight: 32,
          maxHeight: 72, overflow: 'hidden',
          borderRadius: 12, padding: subtitle ? '8px 14px' : 0,
          color: '#fff', fontSize: 14, lineHeight: 1.5, textAlign: 'center',
          transition: 'all 0.3s',
        }}>
          {subtitle}
          {replying && <span style={{ animation: 'blink 0.6s step-end infinite', color: '#c8963e' }}>|</span>}
        </div>

        {/* 状态文字 */}
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, height: 16 }}>
          {statusText}
        </div>

        {/* 麦克风按钮 + 声波纹 */}
        <div style={{ position: 'relative' }}>
          {listening && <div className="sound-wave-ring" />}
          <button onClick={listening ? stopListen : startListen} style={{
          width: 64, height: 64, borderRadius: '50%',
          border: `2px solid ${listening ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.25)'}`,
          background: listening
            ? 'radial-gradient(circle, #d9534f 0%, #a0302a 100%)'
            : 'radial-gradient(circle, #c8963e 0%, #8a5e1c 100%)',
          color: '#fff', fontSize: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: listening
            ? '0 0 24px rgba(217,83,79,0.4)'
            : '0 0 24px rgba(200,150,62,0.25)',
          transition: 'all 0.3s',
          animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
        }}>
          {listening ? '⏹' : '🎤'}
        </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
