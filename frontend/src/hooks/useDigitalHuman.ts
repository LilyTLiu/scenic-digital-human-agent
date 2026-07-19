import { useRef, useState, useCallback, useEffect } from 'react'

const API = '/ot'  // Vite 代理 → localhost:8210

interface DHState {
  sessionId: string | null
  stream: MediaStream | null
  status: 'idle' | 'connecting' | 'live' | 'error'
  error: string
}

export function useDigitalHuman(defaultAvatar = 'ancient-beauty') {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const avatarRef = useRef(defaultAvatar)
  const [state, setState] = useState<DHState>({
    sessionId: null, stream: null, status: 'idle', error: '',
  })
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (state.stream && videoRef.current) {
      videoRef.current.srcObject = state.stream
      videoRef.current.muted = false    // WebRTC 音频可听见；本地 Audio 静音仅用于字幕同步
      videoRef.current.autoplay = true
      videoRef.current.playsInline = true
      void videoRef.current.play().catch(() => {})
    }
  }, [state.stream, state.status])

  const connect = useCallback(async (avatarId?: string) => {
    const aid = avatarId || avatarRef.current
    if (avatarId) avatarRef.current = avatarId
    try {
      setState(s => ({ ...s, status: 'connecting', error: '' }))

      const res = await fetch(`${API}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: aid,
          model: 'quicktalk',
          tts_provider: 'edge',
          stt_provider: 'dashscope',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || `Session create failed: ${res.status}`)
      }
      const { session_id } = await res.json()
      console.log('[DH] Session created:', session_id)

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      pcRef.current = pc

      const iceTimeout = setTimeout(() => {
        if (stateRef.current.status === 'connecting') {
          pc.close()
          setState(s => ({ ...s, status: 'error', error: 'ICE 连接超时' }))
        }
      }, 20000)

      pc.oniceconnectionstatechange = () => {
        console.log('[DH] ICE:', pc.iceConnectionState)
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          clearTimeout(iceTimeout)
        }
      }
      pc.onconnectionstatechange = () => {
        console.log('[DH] Conn:', pc.connectionState)
      }

      const stream = new MediaStream()

      pc.ontrack = (ev) => {
        console.log('[DH] Track:', ev.track?.kind)
        if (ev.track && !stream.getTracks().some(t => t.id === ev.track!.id)) {
          stream.addTrack(ev.track!)
        }
      }

      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log('[DH] Offer sent')

      const answerRes = await fetch(`${API}/sessions/${session_id}/webrtc/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: pc.localDescription!.sdp, type: 'offer' }),
      })
      if (!answerRes.ok) {
        const err = await answerRes.json()
        throw new Error(err.detail || 'WebRTC offer failed')
      }
      await pc.setRemoteDescription(new RTCSessionDescription(await answerRes.json()))

      await fetch(`${API}/sessions/${session_id}/start`, { method: 'POST' })
      console.log('[DH] Started')

      clearTimeout(iceTimeout)
      // stream 存入 state → useEffect 自动挂到 videoRef.current
      setState({ sessionId: session_id, stream, status: 'live', error: '' })
    } catch (e: any) {
      console.error('[DH] Failed:', e.message)
      setState(s => ({ ...s, status: 'error', error: e.message || String(e) }))
    }
  }, [])

  // 发送文字（经 OpenTalking LLM）
  const speak = useCallback(async (text: string) => {
    const sid = stateRef.current.sessionId
    if (!sid || stateRef.current.status !== 'live') return
    try {
      await fetch(`${API}/sessions/${sid}/speak`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
    } catch (e) { console.error('[DH] speak error:', e) }
  }, [])

  // 发送音频直驱口型（绕过 LLM + TTS）
  const speakAudio = useCallback(async (audioBlob: Blob) => {
    const sid = stateRef.current.sessionId
    if (!sid || stateRef.current.status !== 'live') return
    try {
      const form = new FormData()
      form.append('file', audioBlob, 'speech.mp3')
      const res = await fetch(`${API}/sessions/${sid}/speak_flashtalk_audio`, {
        method: 'POST', body: form,
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`speakAudio failed: ${res.status} ${errText}`)
      }
      console.log('[DH] speakAudio: OK')
    } catch (e) { console.error('[DH] speakAudio error:', e) }
  }, [])

  const disconnect = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    const sid = stateRef.current.sessionId
    if (sid) {
      fetch(`${API}/sessions/${sid}`, { method: 'DELETE' }).catch(() => {})
    }
    setState({ sessionId: null, stream: null, status: 'idle', error: '' })
  }, [])

  useEffect(() => {
    return () => {
      pcRef.current?.close()
      const sid = stateRef.current?.sessionId
      if (sid) {
        fetch(`${API}/sessions/${sid}`, { method: 'DELETE', keepalive: true }).catch(() => {})
      }
    }
  }, [])

  return { videoRef, ...state, connect, speak, speakAudio, disconnect }
}
