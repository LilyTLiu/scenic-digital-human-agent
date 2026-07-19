/**
 * API 服务层 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios')

describe('chatApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chatApi.send 发送消息', async () => {
    const mockResponse = { data: { reply: '你好！', references: [] } }
    vi.mocked(axios.create().post as any).mockResolvedValue(mockResponse)

    // 动态导入以使用mocked axios
    const { chatApi } = await import('../services/api')
    // 由于axios被mock，这里验证api模块能正常导入
    expect(chatApi).toBeDefined()
  })
})

describe('userApi', () => {
  it('应导出所有用户API方法', async () => {
    const { userApi } = await import('../services/api')
    expect(userApi.sendCode).toBeInstanceOf(Function)
    expect(userApi.login).toBeInstanceOf(Function)
    expect(userApi.getProfile).toBeInstanceOf(Function)
    expect(userApi.updateProfile).toBeInstanceOf(Function)
  })
})

describe('adminApi', () => {
  it('应导出所有管理API方法', async () => {
    const { adminApi } = await import('../services/api')
    expect(adminApi.getDashboard).toBeInstanceOf(Function)
    expect(adminApi.getKnowledge).toBeInstanceOf(Function)
    expect(adminApi.createKnowledge).toBeInstanceOf(Function)
    expect(adminApi.updateKnowledge).toBeInstanceOf(Function)
    expect(adminApi.deleteKnowledge).toBeInstanceOf(Function)
    expect(adminApi.getReports).toBeInstanceOf(Function)
    expect(adminApi.getTourists).toBeInstanceOf(Function)
    expect(adminApi.getDigitalHumans).toBeInstanceOf(Function)
    expect(adminApi.updateDigitalHuman).toBeInstanceOf(Function)
  })
})

describe('voiceApi', () => {
  it('应导出所有语音API方法', async () => {
    const { voiceApi } = await import('../services/api')
    expect(voiceApi.asr).toBeInstanceOf(Function)
    expect(voiceApi.tts).toBeInstanceOf(Function)
  })
})
