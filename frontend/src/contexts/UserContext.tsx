import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { userApi } from '../services/api'

export interface UserProfile {
  nickname: string
  phone: string
  avatar: string
  interests: string[]
  travel_style: string
  group_type: string
}

interface UserContextType {
  user: UserProfile | null
  token: string | null
  login: (phone: string, code: string) => Promise<string | null>
  logout: () => void
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  token: null,
  login: async () => null,
  logout: () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
})

const TOKEN_KEY = 'lingshan_token'

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  const refreshProfile = useCallback(async () => {
    if (!token) return
    try {
      const res = await userApi.getProfile(token)
      if (res.success) {
        setUser({
          nickname: res.nickname,
          phone: res.phone,
          avatar: res.avatar || '',
          interests: res.interests || [],
          travel_style: res.travel_style || '',
          group_type: res.group_type || '',
        })
      } else {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      }
    } catch {
      // server not available, keep current state
    }
  }, [token])

  useEffect(() => {
    if (token) refreshProfile()
  }, [token, refreshProfile])

  const login = useCallback(async (phone: string, code: string): Promise<string | null> => {
    const res = await userApi.login(phone, code)
    if (res.success && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token)
      setToken(res.token)
      setUser({
        nickname: res.nickname || `游客${phone.slice(-4)}`,
        phone: res.phone || phone,
        avatar: '',
        interests: [],
        travel_style: '',
        group_type: '',
      })
      return null
    }
    return res.error || '登录失败'
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!token) return
    await userApi.updateProfile(token, {
      nickname: data.nickname,
      interests: data.interests,
      travel_style: data.travel_style,
      group_type: data.group_type,
    })
    await refreshProfile()
  }, [token, refreshProfile])

  return (
    <UserContext.Provider value={{ user, token, login, logout, updateProfile, refreshProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
