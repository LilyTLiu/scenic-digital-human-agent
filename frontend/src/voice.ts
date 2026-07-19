const VOICE_NAME_MAP: Record<string, string> = {
  'zh-CN-XiaoxiaoNeural': 'Xiaoxiao',
  'zh-CN-YunxiNeural': 'Yunxi',
  'zh-CN-XiaoyiNeural': 'Xiaoyi',
  'zh-CN-YunjianNeural': 'Yunjian',
}

let cachedVoices: SpeechSynthesisVoice[] = []

export function preloadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      cachedVoices = voices
      resolve(voices)
      return
    }
    const onChanged = () => {
      cachedVoices = window.speechSynthesis.getVoices()
      window.speechSynthesis.removeEventListener('voiceschanged', onChanged)
      resolve(cachedVoices)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onChanged)
  })
}

// App 启动时预加载
preloadVoices()

/**
 * 查找匹配特定 edge-tts 声线的浏览器本地语音。
 * 只做精确匹配——如果找不到对应声线，返回 null，
 * 由调用方降级到 edge-tts API（可提供真正不同的声音）。
 */
export function findBestVoice(edgeTtsVoice: string): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  const target = VOICE_NAME_MAP[edgeTtsVoice]
  if (!target) return null
  // 精确匹配声线名
  const v = voices.find((v) => v.lang.startsWith('zh-CN') && v.name.includes(target))
  return v || null
}

/**
 * 降级方案：找一个可用的中文语音（所有角色共用的兜底）
 */
export function findFallbackVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  let v = voices.find((v) => v.lang.startsWith('zh-CN') && v.name.includes('Microsoft'))
  if (!v) v = voices.find((v) => v.lang.startsWith('zh-CN'))
  if (!v) v = voices.find((v) => v.lang.startsWith('zh'))
  return v || null
}
