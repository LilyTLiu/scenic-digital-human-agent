declare module '@met4citizen/talkinghead' {
  export class TalkingHead {
    audioCtx: AudioContext

    constructor(node: HTMLElement, opt?: Record<string, unknown>)

    showAvatar(avatar: {
      url: string
      body?: string
      avatarMood?: string
      lipsyncLang?: string
      ttsLang?: string
      ttsVoice?: string
      ttsRate?: number
      ttsPitch?: number
      ttsVolume?: number
      avatarMute?: boolean
      avatarIdleEyeContact?: number
      avatarSpeakingEyeContact?: number
      avatarIgnoreCamera?: boolean
      modelDynamicBones?: unknown[]
      lipsyncHeadMovement?: number
      baseline?: Record<string, number>
    }, onprogress?: ((ev: { lengthComputable: boolean; loaded: number; total: number }) => void) | null): Promise<void>

    speakText(text: string, opt?: Record<string, unknown>): void
    speakAudio(
      audio: {
        audio: AudioBuffer | ArrayBuffer[]
        words: string[]
        wtimes: number[]
        wdurations: number[]
        visemes?: string[]
        vtimes?: number[]
        vdurations?: number[]
        markers?: Array<() => void>
        mtimes?: number[]
        anim?: unknown
      },
      opt?: Record<string, unknown>,
      onsubtitles?: ((node: HTMLElement) => void) | null,
    ): void
    setMood(mood: string): void
    setView(view: string, opt?: Record<string, unknown>): void
    lookAtCamera(t: number): void
    lookAt(x: number, y: number, t: number): void
    start(): void
    stop(): void
    speakBreak(t: number): void
    speakEmoji(e: string): void
    speakMarker(onmarker: () => void): void
    setMixerGain(speech: number, background?: number | null, fadeSecs?: number): void
    startListening(analyzer: AnalyserNode, opt?: Record<string, unknown>, onchange?: ((state: string) => void) | null): void
    stopListening(): void
    streamStart(opt?: Record<string, unknown>, onAudioStart?: (() => void) | null, onAudioEnd?: (() => void) | null, onSubtitles?: ((node: HTMLElement) => void) | null, onMetrics?: ((m: unknown) => void) | null): void
    streamAudio(audio: ArrayBuffer): void
    streamNotifyEnd(): void
    streamInterrupt(): void
    streamStop(): void
  }
}
