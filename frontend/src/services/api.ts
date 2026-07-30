import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

// 对话 - 支持普通模式与流式模式
export const chatApi = {
  send: (data: { message: string; scenic_spot?: string; session_id?: string; persona_name?: string; persona_role?: string; persona_style?: string }) =>
    api.post('/chat/send', data).then((r) => r.data),

  sendStream: (
    data: { message: string; scenic_spot?: string; session_id?: string; persona_name?: string; persona_role?: string; persona_style?: string },
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
  ) => {
    const controller = new AbortController()
    fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, stream: true }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const reader = res.body?.getReader()
        if (!reader) throw new Error('No reader available')
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6))
                if (parsed.done) {
                  onDone()
                } else if (parsed.token) {
                  onToken(parsed.token)
                }
              } catch { /* skip malformed JSON */ }
            }
          }
        }
        onDone()
      })
      .catch((err) => onError(err))
    return controller
  },
}

// 语音服务
export const voiceApi = {
  asr: (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.wav')
    return api.post('/voice/asr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }).then((r) => r.data)
  },
  tts: (text: string, voice?: string, style?: string, rate?: string, pitch?: string) =>
    api.post('/voice/tts', { text, voice, style, rate, pitch }, {
      responseType: 'blob',
      timeout: 5000, // 5s 超时，快速降级到浏览器 TTS
    }).then((r) => r.data),
}

// 管理后台
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  getKnowledge: (params?: any) => api.get('/admin/knowledge', { params }).then((r) => r.data),
  createKnowledge: (data: any) => api.post('/admin/knowledge', data).then((r) => r.data),
  updateKnowledge: (id: string, data: any) => api.put(`/admin/knowledge/${id}`, data).then((r) => r.data),
  deleteKnowledge: (id: string) => api.delete(`/admin/knowledge/${id}`).then((r) => r.data),
  getChatRecords: (params?: any) => api.get('/admin/chat-records', { params }).then((r) => r.data),
  getDigitalHumans: () => api.get('/admin/digital-humans').then((r) => r.data),
  updateDigitalHuman: (id: string, config: any) => api.put(`/admin/digital-humans/${id}`, config).then((r) => r.data),
  // 景区管理
  getScenicSpots: () => api.get('/admin/scenic-spots').then((r) => r.data),
  createScenicSpot: (data: { name: string; slug: string; description?: string }) =>
    api.post('/admin/scenic-spots', data).then((r) => r.data),
  updateScenicSpot: (id: number, data: { name: string; slug: string; description?: string }) =>
    api.put(`/admin/scenic-spots/${id}`, data).then((r) => r.data),
  deleteScenicSpot: (id: number) => api.delete(`/admin/scenic-spots/${id}`).then((r) => r.data),
  getReports: () => api.get('/admin/reports').then((r) => r.data),
  submitFeedback: (rating: number, question?: string) => api.post('/admin/feedback', { rating, question }).then((r) => r.data),
  getFeedbackStats: () => api.get('/admin/feedback/stats').then((r) => r.data),
  importDemo: () => api.post('/admin/import-demo').then((r) => r.data),
  getTourists: () => api.get('/admin/tourists').then((r) => r.data),
}

// 景区列表（游客端用）
export const scenicApi = {
  list: () => api.get('/admin/scenic-spots').then((r) => r.data),
}

// 游客行为推荐
export const touristApi = {
  getRecommend: (params?: { age?: number; budget?: string; style?: string; group?: string }) =>
    api.get('/admin/tourist/recommend', { params }).then((r) => r.data),
  getInsights: () => api.get('/admin/tourist/insights').then((r) => r.data),
}

// 游客评价
export const reviewApi = {
  list: (spotId: string, page = 1, size = 50) =>
    api.get('/admin/reviews', { params: { spot_id: spotId, page, size } }).then((r) => r.data),
  create: (data: { spot_id: string; author: string; avatar: string; rating: number; text: string }) =>
    api.post('/admin/reviews', data).then((r) => r.data),
  delete: (id: number) => api.delete(`/admin/reviews/${id}`).then((r) => r.data),
  stats: () => api.get('/admin/reviews/stats').then((r) => r.data),
}

// 游客打卡
export const checkinApi = {
  list: (spotId: string, page = 1, size = 50) =>
    api.get('/admin/checkins', { params: { spot_id: spotId, page, size } }).then((r) => r.data),
  create: (data: { spot_id: string; author: string; image: string; caption: string }) =>
    api.post('/admin/checkins', data).then((r) => r.data),
  delete: (id: number) => api.delete(`/admin/checkins/${id}`).then((r) => r.data),
}

// 用户系统
export const userApi = {
  sendCode: (phone: string) => api.post('/user/send-code', { phone }).then((r) => r.data),
  login: (phone: string, code: string) => api.post('/user/login', { phone, code }).then((r) => r.data),
  getProfile: (token: string) =>
    api.get('/user/profile', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),
  updateProfile: (token: string, data: any) =>
    api.put('/user/profile', data, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),
}

export default api
