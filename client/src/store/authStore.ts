import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  xp: number
  level: number
  pet: string
  streakDays: number
}

interface AuthState {
  user:       AuthUser | null
  token:      string | null
  loading:    boolean
  error:      string | null
  register:   (email: string, password: string, displayName: string) => Promise<void>
  login:      (email: string, password: string) => Promise<void>
  logout:     () => void
  clearError: () => void
  refreshMe:  () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:    null,
      token:   null,
      loading: false,
      error:   null,

      register: async (email, password, displayName) => {
        set({ loading: true, error: null })
        try {
          const { data } = await api.post('/auth/register', { email, password, displayName })
          localStorage.setItem('mellow_token', data.token)
          set({ user: data.user, token: data.token, loading: false })
        } catch (err: any) {
          set({ error: err.response?.data?.error ?? 'Registration failed', loading: false })
          throw err
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('mellow_token', data.token)
          set({ user: data.user, token: data.token, loading: false })
        } catch (err: any) {
          set({ error: err.response?.data?.error ?? 'Login failed', loading: false })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('mellow_token')
        set({ user: null, token: null })
      },

      clearError: () => set({ error: null }),

      refreshMe: async () => {
        if (!get().token) return
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'mellow-auth',
      partialize: s => ({ user: s.user, token: s.token }),
    }
  )
)

export function useAuth()      { return useAuthStore() }
export function useUser()      { return useAuthStore(s => s.user) }
export function useIsLoggedIn(){ return useAuthStore(s => !!s.token) }
