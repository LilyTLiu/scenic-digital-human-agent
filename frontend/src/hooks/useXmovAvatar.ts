import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_SDK_URL = 'https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar@latest.js'
const DEFAULT_GATEWAY = 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'
const DESTROY_TIMEOUT_MS = 3000

type XmovAvatarStatus = 'idle' | 'loading-sdk' | 'initializing' | 'live' | 'speaking' | 'error'

interface XmovAvatarOptions {
  appId?: string
  appSecret?: string
  sdkUrl?: string
  gatewayServer?: string
  headers?: Record<string, string>
  initModel?: 'normal' | 'invisible'
}

interface XmovAvatarInstance {
  init: (options: {
    onDownloadProgress: (progress: number) => void
    initModel?: 'normal' | 'invisible'
  }) => Promise<void>
  speak: (ssml: string, isStart?: boolean, isEnd?: boolean, extra?: Record<string, unknown>) => void
  interactiveidle?: () => void
  changeAvatarVisible?: (visible: boolean) => void
  setVolume?: (volume: number) => void
  destroy: (reason?: string) => Promise<unknown>
}

interface XmovAvatarConstructorOptions {
  containerId: string
  appId: string
  appSecret: string
  gatewayServer: string
  headers?: Record<string, string>
  hardwareAcceleration?: 'default' | 'prefer-hardware' | 'prefer-software'
  onMessage?: (message: unknown) => void
  onStateChange?: (state: string) => void
  onStatusChange?: (status: number) => void
  onVoiceStateChange?: (status: string) => void
  enableLogger?: boolean
}

declare global {
  interface Window {
    XmovAvatar?: new (options: XmovAvatarConstructorOptions) => XmovAvatarInstance
  }
}

let sdkLoadPromise: Promise<void> | null = null

function loadXmovSdk(src: string) {
  if (window.XmovAvatar) return Promise.resolve()
  if (sdkLoadPromise) return sdkLoadPromise

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-xmov-sdk="${src}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('魔珐星云 SDK 加载失败')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.xmovSdk = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('魔珐星云 SDK 加载失败'))
    document.body.appendChild(script)
  })

  return sdkLoadPromise
}

function makeContainerId() {
  return `xmov-avatar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('魔珐星云会话结束超时')), timeoutMs)
    }),
  ])
}

export function useXmovAvatar(options: XmovAvatarOptions = {}) {
  const instanceRef = useRef<XmovAvatarInstance | null>(null)
  const didSpeakRef = useRef(false)
  const connectPromiseRef = useRef<Promise<void> | null>(null)
  const containerIdRef = useRef(makeContainerId())
  const [status, setStatus] = useState<XmovAvatarStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const config = useMemo(() => {
    const appId = options.appId ?? import.meta.env.VITE_XMOV_APP_ID
    const appSecret = options.appSecret ?? import.meta.env.VITE_XMOV_APP_SECRET
    const sdkUrl = options.sdkUrl ?? import.meta.env.VITE_XMOV_SDK_URL ?? DEFAULT_SDK_URL
    const gatewayServer = options.gatewayServer ?? import.meta.env.VITE_XMOV_GATEWAY_SERVER ?? DEFAULT_GATEWAY
    return {
      appId,
      appSecret,
      sdkUrl,
      gatewayServer,
      initModel: options.initModel ?? 'normal',
      headers: options.headers,
      configured: Boolean(appId && appSecret),
    }
  }, [options.appId, options.appSecret, options.gatewayServer, options.headers, options.initModel, options.sdkUrl])

  const disconnect = useCallback(async () => {
    const instance = instanceRef.current
    instanceRef.current = null
    didSpeakRef.current = false
    setProgress(0)
    setStatus('idle')
    if (instance) {
      try {
        await withTimeout(instance.destroy('user'), DESTROY_TIMEOUT_MS)
      } catch (err) {
        console.warn('[XmovAvatar] destroy failed:', err)
      }
    }
  }, [])

  const connect = useCallback(async () => {
    if (connectPromiseRef.current) return connectPromiseRef.current
    if (instanceRef.current && status !== 'idle' && status !== 'error') return
    if (!config.configured) {
      setStatus('error')
      setError('请先配置当前数字人的应用参数')
      return
    }

    const promise = (async () => {
      await disconnect()
      setStatus('loading-sdk')
      setError('')

      try {
        await loadXmovSdk(config.sdkUrl)
        if (!window.XmovAvatar) throw new Error('未检测到 window.XmovAvatar')

        setStatus('initializing')
        const instance = new window.XmovAvatar({
          containerId: `#${containerIdRef.current}`,
          appId: config.appId!,
          appSecret: config.appSecret!,
          gatewayServer: config.gatewayServer,
          headers: config.headers,
          hardwareAcceleration: 'prefer-hardware',
          onMessage: (message) => {
            console.log('[XmovAvatar] message:', message)
          },
          onStateChange: (state) => {
            console.log('[XmovAvatar] state:', state)
          },
          onStatusChange: (nextStatus) => {
            console.log('[XmovAvatar] status:', nextStatus)
            if (nextStatus === 4) setStatus('idle')
            if (nextStatus === 0 || nextStatus === 5 || nextStatus === 6) setStatus('live')
          },
          onVoiceStateChange: (voiceStatus) => {
            console.log('[XmovAvatar] voice:', voiceStatus)
            if (voiceStatus === 'voice_start' || voiceStatus === 'start') setStatus('speaking')
            if (voiceStatus === 'voice_end' || voiceStatus === 'end') setStatus('live')
          },
          enableLogger: false,
        })

        instanceRef.current = instance
        await instance.init({
          initModel: config.initModel,
          onDownloadProgress: (nextProgress: number) => {
            setProgress(Math.max(0, Math.min(100, nextProgress)))
          },
        })
        instance.changeAvatarVisible?.(true)
        window.dispatchEvent(new Event('resize'))
        setStatus('live')
      } catch (err: any) {
        console.error('[XmovAvatar] init failed:', err)
        instanceRef.current = null
        setStatus('error')
        setError(err?.message || String(err))
      } finally {
        connectPromiseRef.current = null
      }
    })()
    connectPromiseRef.current = promise
    return promise
  }, [config, disconnect, status])

  const speak = useCallback(async (text: string) => {
    const content = text.trim()
    if (!content || !instanceRef.current) return
    if (didSpeakRef.current) instanceRef.current.interactiveidle?.()
    didSpeakRef.current = true
    setStatus('speaking')
    instanceRef.current.speak(content, true, true)
  }, [])

  const stopSpeaking = useCallback(() => {
    instanceRef.current?.interactiveidle?.()
    setStatus(instanceRef.current ? 'live' : 'idle')
  }, [])

  const setVolume = useCallback((volume: number) => {
    instanceRef.current?.setVolume?.(Math.max(0, Math.min(1, volume)))
  }, [])

  useEffect(() => {
    return () => {
      void disconnect()
    }
  }, [disconnect])

  return {
    containerId: containerIdRef.current,
    configured: config.configured,
    status,
    progress,
    error,
    connect,
    disconnect,
    speak,
    stopSpeaking,
    setVolume,
  }
}
