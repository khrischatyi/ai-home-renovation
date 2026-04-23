import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Paths that should NOT trigger the global "refresh-or-redirect-to-login"
// fallback on a 401. These are either auth-establishing endpoints (where a
// 401 means "bad credentials", not "session expired") or read-only auth
// probes used to populate the store.
const AUTH_CHECK_PATHS = [
  '/users/me',
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/ensure-from-intake',
  '/auth/check-email',
]

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
