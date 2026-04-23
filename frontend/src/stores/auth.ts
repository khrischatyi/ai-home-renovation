import { create } from 'zustand'
import { authApi } from '@/api/auth'

interface User {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  password_set: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  ensureFromIntake: (email: string, fullName?: string) => Promise<void>
  claimPassword: (password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async (email, password) => {
    await authApi.login({ email, password })
    const response = await authApi.me()
    set({ user: (response as any).data, isAuthenticated: true })
  },
  register: async (email, password, fullName) => {
    await authApi.register({ email, password, full_name: fullName })
    const response = await authApi.me()
    set({ user: (response as any).data, isAuthenticated: true })
  },
  ensureFromIntake: async (email, fullName) => {
    await authApi.ensureFromIntake({ email, full_name: fullName })
    const response = await authApi.me()
    set({ user: (response as any).data, isAuthenticated: true })
  },
  claimPassword: async (password) => {
    const res: any = await authApi.claimPassword(password)
    set({ user: res.data, isAuthenticated: true })
  },
  logout: async () => {
    await authApi.logout()
    set({ user: null, isAuthenticated: false })
  },
  checkAuth: async () => {
    try {
      const response = await authApi.me()
      set({ user: (response as any).data, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
  refreshMe: async () => {
    try {
      const response = await authApi.me()
      set({ user: (response as any).data, isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },
}))
