import { useEffect, useRef, useCallback, useState } from 'react'
import { TalkingHead } from '@met4citizen/talkinghead'

export type Emotion3D = 'neutral' | 'happy' | 'thinking' | 'surprised' | 'sad'

interface Props {
  speaking: boolean
  emotion?: Emotion3D
  listening?: boolean
  size?: number
  avatarUrl?: string
  /** 'M' or 'F' body type for skeleton mapping */
  body?: string
  /** TTS audio blob URL to speak */
  audioUrl?: string | null
  /** Text content for word timing estimation */
  text?: string
  onAudioEnd?: () => void
  onLoadProgress?: (pct: number) => void
}

const EMOTION_TO_MOOD: Record<Emotion3D, string> = {
  neutral: 'neutral',
  happy: 'happy',
  thinking: 'neutral',
  surprised: 'fear',
  sad: 'sad',
}

function estimateChineseWords(text: string, durationMs: number): { words: string[]; wtimes: number[]; wdurations: number[] } {
  const chars = text.replace(/[，。！？、\s]/g, '').split('')
  if (chars.length === 0) return { words: ['...'], wtimes: [0], wdurations: [durationMs] }

  // Group 2 chars per "word" for more natural rhythm
  const words: string[] = []
  const wtimes: number[] = []
  const wdurations: number[] = []

  const charDuration = durationMs / chars.length
  for (let i = 0; i < chars.length; i += 2) {
    const word = chars.slice(i, i + 2).join('')
    words.push(word)
    wtimes.push(i * charDuration)
    wdurations.push(Math.min(2, chars.length - i) * charDuration)
  }

  return { words, wtimes, wdurations }
}

export default function DigitalHuman3D({
  speaking,
  emotion = 'neutral',
  listening = false,
  size = 300,
  avatarUrl = '/avatars/brunette.glb',
  body = 'F',
  audioUrl,
  text,
  onAudioEnd,
  onLoadProgress,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<TalkingHead | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevSpeakingRef = useRef(false)
  const prevAudioUrlRef = useRef<string | null | undefined>(null)
  const audioEndRef = useRef<(() => void) | null>(null)

  // Store the latest onAudioEnd callback
  audioEndRef.current = onAudioEnd || null

  // Initialize TalkingHead
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false

    const init = async () => {
      try {
        const head = new TalkingHead(container, {
          cameraView: 'upper',
          cameraDistance: 0.1,
          cameraRotateEnable: false,
          cameraZoomEnable: false,
          cameraPanEnable: false,
          modelPixelRatio: Math.min(window.devicePixelRatio, 2),
          modelFPS: 30,
          avatarMood: 'neutral',
          avatarIdleEyeContact: 0.3,
          avatarIdleHeadMove: 0.4,
          avatarSpeakingEyeContact: 0.6,
          avatarSpeakingHeadMove: 0.3,
          lightAmbientColor: 0xffeedd,
          lightAmbientIntensity: 2.5,
          lightDirectColor: 0xffffff,
          lightDirectIntensity: 20,
          lightDirectPhi: 0.3,
          lightDirectTheta: 1.5,
          ttsEndpoint: '',
          lipsyncModules: [],
        })

        if (disposed) { head.stop(); return }

        await head.showAvatar({
          url: avatarUrl,
          body: body,
          avatarMood: 'neutral',
          lipsyncLang: 'en',
        }, (ev: any) => {
          if (ev.lengthComputable && onLoadProgress) {
            onLoadProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)))
          }
        })

        if (disposed) { head.stop(); return }

        headRef.current = head
        setLoaded(true)
        setError(null)
      } catch (err: any) {
        if (!disposed) {
          console.error('DigitalHuman3D init error:', err)
          setError(err.message || 'Failed to load avatar')
        }
      }
    }

    init()

    return () => {
      disposed = true
      if (headRef.current) {
        headRef.current.stop()
        headRef.current = null
      }
    }
  }, [avatarUrl])

  // Handle emotion changes
  useEffect(() => {
    if (!headRef.current || !loaded) return
    const mood = EMOTION_TO_MOOD[emotion] || 'neutral'
    headRef.current.setMood(mood)
  }, [emotion, loaded])

  // Handle speaking state & audio playback
  useEffect(() => {
    const head = headRef.current
    if (!head || !loaded) return

    const startedSpeaking = speaking && !prevSpeakingRef.current
    const audioChanged = audioUrl && audioUrl !== prevAudioUrlRef.current

    prevSpeakingRef.current = speaking
    prevAudioUrlRef.current = audioUrl

    if (startedSpeaking && audioChanged) {
      handleSpeak(head, audioUrl, text, () => {
        audioEndRef.current?.()
      })
    } else if (startedSpeaking && !audioUrl && text) {
      // No audio - just set mood and let idle animation run
      head.lookAtCamera(2000)
    }

    if (!speaking && prevSpeakingRef.current !== speaking) {
      // Stopped speaking - reset mood
      head.setMood(EMOTION_TO_MOOD[emotion] || 'neutral')
    }
  }, [speaking, audioUrl, text, loaded])

  // Handle listening state
  useEffect(() => {
    if (!headRef.current || !loaded) return
    if (listening) {
      headRef.current.setMood('neutral')
      headRef.current.lookAtCamera(2000)
    }
  }, [listening, loaded])

  // Handle resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      // TalkingHead handles its own resize via CSS
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const style = {
    width: size,
    height: Math.round(size * 1.35), // extra height for upper body
    maxWidth: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    background: error ? '#f5f1eb' : 'transparent',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div ref={containerRef} style={style} />
      {!loaded && !error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(245,241,235,0.9)', borderRadius: 16,
          color: '#9c948c', fontSize: 14,
        }}>
          加载数字人...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(245,241,235,0.95)', borderRadius: 16,
          color: '#c05850', fontSize: 13, textAlign: 'center', padding: 16,
        }}>
          3D数字人加载失败，请刷新重试
        </div>
      )}
    </div>
  )
}

async function handleSpeak(
  head: TalkingHead,
  audioUrl: string,
  text: string | undefined,
  onEnd: () => void,
) {
  try {
    const response = await fetch(audioUrl)
    const arrayBuffer = await response.arrayBuffer()

    // Use TalkingHead's AudioContext to decode
    const audioBuffer = await head.audioCtx.decodeAudioData(arrayBuffer)
    const durationMs = (audioBuffer.duration || 2) * 1000

    // Estimate word timings from Chinese text
    const { words, wtimes, wdurations } = text
      ? estimateChineseWords(text, durationMs)
      : { words: ['...'], wtimes: [0], wdurations: [durationMs] }

    const audio = {
      audio: audioBuffer,
      words,
      wtimes,
      wdurations,
    }

    // Add end marker
    const markers: Array<() => void> = [onEnd]
    const mtimes: number[] = [durationMs - 100]

    head.speakAudio(
      { ...audio, markers, mtimes },
      { isRaw: false },
      undefined,
    )
  } catch (err) {
    console.error('speakAudio error:', err)
    onEnd()
  }
}
