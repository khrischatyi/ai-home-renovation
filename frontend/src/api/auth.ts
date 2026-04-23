import api from './client'

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/users/me'),
  checkEmail: (email: string) =>
    api.post('/auth/check-email', { email }),
  ensureFromIntake: (data: { email: string; full_name?: string }) =>
    api.post('/auth/ensure-from-intake', data),
  claimPassword: (password: string) =>
    api.post('/auth/claim-password', { password }),
  requestPasswordReset: (email: string) =>
    api.post('/auth/request-password-reset', { email }),
  resetPassword: (data: { email: string; code: string; new_password: string }) =>
    api.post('/auth/reset-password', data),
}
