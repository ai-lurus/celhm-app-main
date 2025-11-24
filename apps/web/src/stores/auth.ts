import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser, LoginRequest, LoginResponse } from '@celhm/types'
import { api } from '../lib/api'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post<LoginResponse>('/auth/login', credentials)
          const { access_token, user } = response.data
          
          set({ 
            user, 
            token: access_token, 
            isLoading: false,
            error: null 
          })
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al iniciar sesión',
            isLoading: false 
          })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
)

