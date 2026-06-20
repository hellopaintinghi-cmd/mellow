import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 15000,
})

// Attach JWT token to every request if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mellow_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear token and reload to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mellow_token')
      // Don't hard reload — let the auth store handle it
    }
    return Promise.reject(err)
  }
)

export default api
