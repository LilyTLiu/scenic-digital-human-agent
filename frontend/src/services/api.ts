import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

// 对话 - 支持普通模式与流式模式
export const chatApi = {
  send: (data: { message: string; scenic_spot?: string; stream?: boolean }) =>
    api.post('/chat/send', data).then((r) => r.data),

  sendStream: (
    data: { message: string; scenic_spot?: string },
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
      timeout: 30000,
    }).then((r) => r.data)
  },
  tts: (text: string, voice?: string) =>
    api.post('/voice/tts', { text, voice }, { responseType: 'blob' }).then((r) => r.data),
}

// 管理后台
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  getKnowledge: (params?: any) => api.get('/admin/knowledge', { params }).then((r) => r.data),
  createKnowledge: (data: any) => api.post('/admin/knowledge', data).then((r) => r.data),
  updateKnowledge: (id: string, data: any) => api.put(`/admin/knowledge/${id}`, data).then((r) => r.data),
  deleteKnowledge: (id: string) => api.delete(`/admin/knowledge/${id}`).then((r) => r.data),
  getReports: () => api.get('/admin/reports').then((r) => r.data),
  getDigitalHumans: () => api.get('/admin/digital-humans').then((r) => r.data),
  updateDigitalHuman: (id: string, config: any) => api.put(`/admin/digital-humans/${id}`, config).then((r) => r.data),
}

export default api
