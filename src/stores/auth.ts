import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthUser, LoginRequest } from '@celhm/types'
import { api } from '../lib/api'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  isHydrated: boolean
  isCheckingSession: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  checkSession: () => Promise<boolean>
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isHydrated: false,
      isCheckingSession: false,

      setHydrated: () => {
        set({ isHydrated: true })
      },

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post<{ access_token: string; user: AuthUser }>('/auth/login', credentials)

          set({
            user: data.user,
            token: data.access_token,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          const status = error?.response?.status
          const errorMessage =
            status === 401 ? 'Credenciales inválidas' : 'Error al iniciar sesión'

          set({ user: null, token: null, error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      checkSession: async () => {
        set({ isCheckingSession: true })
        try {
          const response = await api.get<AuthUser>('/auth/me')
          set({ user: response.data, isCheckingSession: false })
          return true
        } catch {
          get().logout()
          set({ isCheckingSession: false })
          return false
        }
      },

      logout: async () => {
        set({ user: null, token: null, error: null })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated()
        }
      },
    }
  )
)
