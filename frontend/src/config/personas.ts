/**
 * 统一数字人定义：每个人设有独立的声音、外观、性格
 * 不再需要单独的"导游选择"和"声线选择"——选人即选声
 */

export type PersonaId = 'xiaoling' | 'xiaoshan' | 'miaoyin' | 'xiaochan'

export interface Persona {
  id: PersonaId
  name: string
  role: string
  style: string
  color: string
  emoji: string
  /** edge-tts voice name */
  voice: string
  /** edge-tts 表达风格 (friendly/calm/gentle/cheerful/...) */
  tts_style?: string
  /** edge-tts 语速调整 (-50% ~ +50%) */
  tts_rate?: string
  /** edge-tts 音调调整 */
  tts_pitch?: string
  /** 浏览器 TTS 降级时的语速 (0.1 ~ 2.0) */
  browser_rate: number
  /** 浏览器 TTS 降级时的音调 (0.1 ~ 2.0) */
  browser_pitch: number
  /** 角色照片 */
  image?: string
  /** Canvas 视觉特征 */
  visual: {
    hairColor: string
    hairStyle: 'short' | 'medium' | 'long'
    skinTone: string  // hex color for base skin
    collarColor: string
    glasses: boolean
    gender: 'female' | 'male'
  }
  /** Ready Player Me avatar GLB URL for 3D rendering */
  avatar3d?: string
}

export const PERSONAS: Record<PersonaId, Persona> = {
  xiaoling: {
    id: 'xiaoling',
    name: '小灵',
    role: '灵山专属导游',
    style: '热情专业',
    color: '#c8963e',
    emoji: '👩‍💼',
    voice: 'zh-CN-XiaoxiaoNeural',
    tts_style: 'friendly',
    tts_rate: '+10%',
    tts_pitch: '+5Hz',
    browser_rate: 1.15,
    browser_pitch: 1.3,
    image: '/character/xiaoling.png',
    avatar3d: '/avatars/brunette.glb',
    visual: {
      hairColor: '#4a2a15',
      hairStyle: 'long',
      skinTone: '#fdf4ee',
      collarColor: '#d4a574',
      glasses: false,
      gender: 'female',
    },
  },
  xiaoshan: {
    id: 'xiaoshan',
    name: '小山',
    role: '佛学文化顾问',
    style: '沉稳博学',
    color: '#5d7a8e',
    emoji: '🧘',
    voice: 'zh-CN-YunxiNeural',
    tts_style: 'calm',
    tts_rate: '-5%',
    tts_pitch: '-3Hz',
    browser_rate: 0.8,
    browser_pitch: 0.75,
    image: '/character/xiaoshan.png',
    avatar3d: '/avatars/avaturn.glb',
    visual: {
      hairColor: '#4a4a4a',
      hairStyle: 'short',
      skinTone: '#e8dcc8',
      collarColor: '#7a8a9a',
      glasses: true,
      gender: 'male',
    },
  },
  miaoyin: {
    id: 'miaoyin',
    name: '妙音',
    role: '艺术鉴赏向导',
    style: '优雅灵动',
    color: '#5d8a7b',
    emoji: '👩‍🎨',
    voice: 'zh-CN-XiaoyiNeural',
    tts_style: 'gentle',
    tts_rate: '+5%',
    tts_pitch: '+8Hz',
    browser_rate: 1.0,
    browser_pitch: 1.2,
    image: '/character/miaoyin.png',
    avatar3d: '/avatars/brunette-t.glb',
    visual: {
      hairColor: '#1a1a2e',
      hairStyle: 'long',
      skinTone: '#fdf4ee',
      collarColor: '#8ab4a8',
      glasses: false,
      gender: 'female',
    },
  },
  xiaochan: {
    id: 'xiaochan',
    name: '小禅',
    role: '禅修体验向导',
    style: '禅意智慧',
    color: '#7a6a5a',
    emoji: '🧘‍♂️',
    voice: 'zh-CN-YunyeNeural',
    tts_style: 'calm',
    tts_rate: '-10%',
    tts_pitch: '-8Hz',
    browser_rate: 0.7,
    browser_pitch: 0.65,
    image: '/character/xiaochan.png',
    avatar3d: '/avatars/avatarsdk.glb',
    visual: {
      hairColor: '#3a3a3a',
      hairStyle: 'short',
      skinTone: '#e8dcc8',
      collarColor: '#9a8a7a',
      glasses: false,
      gender: 'male',
    },
  },
}

export const DEFAULT_PERSONA: PersonaId = 'miaoyin'

export function getPersona(id: string | null | undefined): Persona {
  if (id && id in PERSONAS) return PERSONAS[id as PersonaId]
  return PERSONAS[DEFAULT_PERSONA]
}
