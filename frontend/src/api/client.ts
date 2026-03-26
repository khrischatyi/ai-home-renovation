import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Paths that should not trigger redirect on 401
const AUTH_CHECK_PATHS = ['/users/me', '/auth/refresh']

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const requestPath = error.config?.url || ''
    const isAuthCheck = AUTH_CHECK_PATHS.some((p) => requestPath.includes(p))

    if (error.response?.status === 401 && !isAuthCheck && !error.config._retried) {
      error.config._retried = true
      try {
        await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        return api.request(error.config)
      } catch {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
