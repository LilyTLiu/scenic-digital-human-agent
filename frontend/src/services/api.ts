import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// 对话
export const chatApi = {
  send: (data: { message: string; scenic_spot?: string }) =>
    api.post('/chat/send', data).then((r) => r.data),
}

// 语音
export const voiceApi = {
  asr: (audioFile: File) => {
    const formData = new FormData()
    formData.append('file', audioFile)
    return api.post('/voice/asr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
  tts: (text: string) =>
    api.post('/voice/tts', { text }, { responseType: 'blob' }).then((r) => r.data),
}

// 管理后台
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  getKnowledge: (params?: any) => api.get('/admin/knowledge', { params }).then((r) => r.data),
  createKnowledge: (data: any) => api.post('/admin/knowledge', data).then((r) => r.data),
  updateKnowledge: (id: string, data: any) => api.put(`/admin/knowledge/${id}`, data).then((r) => r.data),
  deleteKnowledge: (id: string) => api.delete(`/admin/knowledge/${id}`).then((r) => r.data),
  getReports: () => api.get('/admin/reports').then((r) => r.data),
}

export default api
