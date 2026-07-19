import type { PersonaId } from '../config/personas'

/**
 * 每个导游的浏览器语音偏好
 * key = edge-tts voice name, value = 浏览器语音名称片段
 * 浏览器语音名称因操作系统和浏览器而异，这里用比匹配度更高的多种模式
 */
const VOICE_PATTERNS: Record<string, string[]> = {
  'zh-CN-XiaoxiaoNeural': ['Xiaoxiao', 'xiaoxiao', 'Xiao Xiao'],
  'zh-CN-YunxiNeural':   ['Yunxi', 'yunxi', 'Yun Xi'],
  'zh-CN-XiaoyiNeural':  ['Xiaoyi', 'xiaoyi', 'Xiao Yi'],
  'zh-CN-YunjianNeural': ['Yunjian', 'yunjian', 'Yun Jian'],
  'zh-CN-YunyeNeural':   ['Yunye', 'yunye', 'Yun Ye'],
}

/** 导游 ID → 性别（用于降级时区分男女声） */
const PERSONA_GENDER: Record<PersonaId, 'female' | 'male'> = {
  xiaoling: 'female',
  xiaoshan: 'male',
  miaoyin: 'female',
  xiaochan: 'male',
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
 * 根据 edge-tts 声线名，找到浏览器中最匹配的语音
 * 优先精确匹配 → 按性别匹配 → 任意中文语音
 */
export function findBestVoice(edgeTtsVoice: string): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  const zhVoices = voices.filter((v) => v.lang.startsWith('zh-'))
  if (zhVoices.length === 0) return null

  // 1. 精确匹配：按 pattern 列表逐一尝试
  const patterns = VOICE_PATTERNS[edgeTtsVoice]
  if (patterns) {
    for (const p of patterns) {
      const found = zhVoices.find((v) => v.name.includes(p))
      if (found) return found
    }
  }

  // 2. 宽泛匹配：按性别（从 persona 推断）
  //    提取 edgeTtsVoice 中的性别信息：female 声线通常含 XiaoXiao/XiaoYi，male 含 YunXi/YunJian/YunYe
  const isFemale = /xiaoxiao|xiaoyi/i.test(edgeTtsVoice)
  const genderLabel = isFemale ? ['female', 'Female', 'girl'] : ['male', 'Male', 'man']
  for (const g of genderLabel) {
    const found = zhVoices.find((v) => v.name.includes(g))
    if (found) return found
  }

  // 3. 任意带 Microsoft 的中文语音
  const ms = zhVoices.find((v) => v.name.includes('Microsoft'))
  if (ms) return ms

  // 4. 任意中文语音
  return zhVoices[0] || null
}

/**
 * 根据导游 ID 获取对应的浏览器语音
 * 先按声线名匹配 → 按性别匹配 → 兜底
 */
export function findPersonaVoice(personaId: PersonaId): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  const zhVoices = voices.filter((v) => v.lang.startsWith('zh-'))
  if (zhVoices.length === 0) return null

  const gender = PERSONA_GENDER[personaId]

  // 1. 按性别找
  const genderKeywords = gender === 'female'
    ? ['female', 'Female', 'Xiaoxiao', 'xiaoxiao', 'Xiaoyi', 'xiaoyi']
    : ['male', 'Male', 'Yunxi', 'yunxi', 'Yunye', 'yunye', 'Yunjian', 'yunjian', 'Kangkang', 'kangkang']

  for (const kw of genderKeywords) {
    const found = zhVoices.find((v) => v.name.includes(kw))
    if (found) return found
  }

  // 2. 兜底：任意带 Microsoft 的中文语音
  const ms = zhVoices.find((v) => v.name.includes('Microsoft'))
  if (ms) return ms

  return zhVoices[0] || null
}

/**
 * 降级方案：找一个可用的中文语音（所有角色共用的最终兜底）
 */
export function findFallbackVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  let v = voices.find((v) => v.lang.startsWith('zh-CN') && v.name.includes('Microsoft'))
  if (!v) v = voices.find((v) => v.lang.startsWith('zh-CN'))
  if (!v) v = voices.find((v) => v.lang.startsWith('zh'))
  return v || null
}
