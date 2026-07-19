/**
 * 角色配置 单元测试
 */
import { describe, it, expect } from 'vitest'
import { PERSONAS, getPersona, DEFAULT_PERSONA } from '../config/personas'

describe('PERSONAS 配置', () => {
  it('应包含4个角色', () => {
    const ids = Object.keys(PERSONAS)
    expect(ids).toHaveLength(4)
    expect(ids).toEqual(['xiaoling', 'xiaoshan', 'miaoyin', 'xiaochan'])
  })

  it('每个角色有完整字段', () => {
    for (const [, persona] of Object.entries(PERSONAS)) {
      expect(persona.id).toBeTruthy()
      expect(persona.name).toBeTruthy()
      expect(persona.role).toBeTruthy()
      expect(persona.style).toBeTruthy()
      expect(persona.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(persona.voice).toBeTruthy()
      expect(persona.visual).toBeDefined()
      expect(persona.visual.hairColor).toBeTruthy()
      expect(['short', 'medium', 'long']).toContain(persona.visual.hairStyle)
      expect(['female', 'male']).toContain(persona.visual.gender)
    }
  })

  it('每个角色有唯一的声音', () => {
    const voices = Object.values(PERSONAS).map(p => p.voice)
    expect(new Set(voices).size).toBe(voices.length)
  })
})

describe('getPersona()', () => {
  it('返回有效角色的配置', () => {
    const p = getPersona('xiaoling')
    expect(p.name).toBe('小灵')
  })

  it('无效角色ID返回默认配置', () => {
    const p = getPersona('invalid_id')
    expect(p.id).toBe(DEFAULT_PERSONA)
  })

  it('null或undefined返回默认配置', () => {
    expect(getPersona(null).id).toBe(DEFAULT_PERSONA)
    expect(getPersona(undefined).id).toBe(DEFAULT_PERSONA)
  })
})
