import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message || err.message || 'An error occurred'
    const code = err.response?.data?.error?.code || 'UNKNOWN_ERROR'
    const details = err.response?.data?.error?.details || null
    const status = err.response?.status || 0
    const enhanced = new Error(message)
    enhanced.code = code
    enhanced.details = details
    enhanced.status = status
    return Promise.reject(enhanced)
  }
)

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}

// Links
export const linksApi = {
  create: (data) => api.post('/links', data).then(r => r.data),
  list: (params) => api.get('/links', { params }).then(r => r.data),
  get: (id) => api.get(`/links/${id}`).then(r => r.data),
  update: (id, data) => api.patch(`/links/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/links/${id}`).then(r => r.data),
}

// Analytics
export const analyticsApi = {
  overview: (params) => api.get('/analytics/overview', { params }).then(r => r.data),
  linkSummary: (id, params) => api.get(`/analytics/links/${id}`, { params }).then(r => r.data),
  timeseries: (params) => api.get('/analytics/timeseries', { params }).then(r => r.data),
  referrers: (params) => api.get('/analytics/referrers', { params }).then(r => r.data),
  devices: (params) => api.get('/analytics/devices', { params }).then(r => r.data),
  locations: (params) => api.get('/analytics/locations', { params }).then(r => r.data),
  campaigns: (params) => api.get('/analytics/campaigns', { params }).then(r => r.data),
  exportCsv: (params) => api.get('/analytics/export.csv', { params, responseType: 'blob' }).then(r => r.data),
}

export default api
