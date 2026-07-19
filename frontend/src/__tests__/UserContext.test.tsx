/**
 * UserContext 测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { UserProvider, useUser } from '../contexts/UserContext'
import type { ReactNode } from 'react'

// Mock api
vi.mock('../services/api', () => ({
  userApi: {
    login: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

// 辅助组件：读取context值
let contextValue: any = null
function Consumer() {
  contextValue = useUser()
  return null
}

function renderWithProvider() {
  render(
    <UserProvider>
      <Consumer />
    </UserProvider>
  )
}

describe('UserContext', () => {
  beforeEach(() => {
    contextValue = null
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('初始状态：未登录', () => {
    renderWithProvider()
    expect(contextValue.user).toBeNull()
    expect(contextValue.token).toBeNull()
  })

  it('从localStorage恢复token', () => {
    localStorage.setItem('lingshan_token', 'saved_token')
    renderWithProvider()
    expect(contextValue.token).toBe('saved_token')
  })

  it('login成功', async () => {
    const { userApi } = await import('../services/api')
    vi.mocked(userApi.login).mockResolvedValue({
      success: true,
      token: 'new_token',
      nickname: '测试用户',
      phone: '13800138000',
    })

    renderWithProvider()

    let error: string | null = 'unknown'
    await act(async () => {
      error = await contextValue.login('13800138000', '1234')
    })

    expect(error).toBeNull()
    expect(contextValue.token).toBe('new_token')
    expect(contextValue.user).not.toBeNull()
    expect(contextValue.user!.nickname).toBe('测试用户')
    expect(localStorage.getItem('lingshan_token')).toBe('new_token')
  })

  it('login失败返回错误消息', async () => {
    const { userApi } = await import('../services/api')
    vi.mocked(userApi.login).mockResolvedValue({
      success: false,
      error: '验证码错误',
    })

    renderWithProvider()

    let error: string | null = null
    await act(async () => {
      error = await contextValue.login('13800138000', '0000')
    })

    expect(error).toBe('验证码错误')
    expect(contextValue.token).toBeNull()
    expect(contextValue.user).toBeNull()
  })

  it('logout清除状态', () => {
    localStorage.setItem('lingshan_token', 'test_token')
    renderWithProvider()

    act(() => {
      contextValue.logout()
    })

    expect(contextValue.token).toBeNull()
    expect(contextValue.user).toBeNull()
    expect(localStorage.getItem('lingshan_token')).toBeNull()
  })
})
