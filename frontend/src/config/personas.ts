/**
 * 统一数字人定义：每个人设有独立的声音、外观、性格
 * 不再需要单独的"导游选择"和"声线选择"——选人即选声
 */

export type PersonaId = 'xiaoling' | 'huijue' | 'miaoyin'

export interface Persona {
  id: PersonaId
  name: string
  role: string
  style: string
  color: string
  emoji: string
  /** edge-tts voice name */
  voice: string
  /** Canvas 视觉特征 */
  visual: {
    hairColor: string
    hairStyle: 'short' | 'medium' | 'long'
    skinTone: string  // hex color for base skin
    collarColor: string
    glasses: boolean
    gender: 'female' | 'male'
  }
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
    visual: {
      hairColor: '#4a2a15',
      hairStyle: 'long',
      skinTone: '#fdf4ee',
      collarColor: '#d4a574',
      glasses: false,
      gender: 'female',
    },
  },
  huijue: {
    id: 'huijue',
    name: '慧觉',
    role: '佛学文化顾问',
    style: '沉稳博学',
    color: '#5d7a8e',
    emoji: '🧘',
    voice: 'zh-CN-YunxiNeural',
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
    visual: {
      hairColor: '#1a1a2e',
      hairStyle: 'long',
      skinTone: '#fdf4ee',
      collarColor: '#8ab4a8',
      glasses: false,
      gender: 'female',
    },
  },
}

export const DEFAULT_PERSONA: PersonaId = 'xiaoling'

export function getPersona(id: string | null | undefined): Persona {
  if (id && id in PERSONAS) return PERSONAS[id as PersonaId]
  return PERSONAS[DEFAULT_PERSONA]
}
