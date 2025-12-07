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
          // Extract error message safely
          let errorMessage = 'Error al iniciar sesión'
          
          if (error?.response?.data) {
            const errorData = error.response.data
            if (typeof errorData === 'string') {
              errorMessage = errorData
            } else if (errorData?.message && typeof errorData.message === 'string') {
              errorMessage = errorData.message
            } else if (errorData?.error && typeof errorData.error === 'string') {
              errorMessage = errorData.error
            }
          } else if (error?.message && typeof error.message === 'string') {
            errorMessage = error.message
          } else if (typeof error === 'string') {
            errorMessage = error
          }
          
          set({ 
            error: errorMessage,
            isLoading: false 
          })
          
          // Throw a normalized error
          const normalizedError = new Error(errorMessage)
          ;(normalizedError as any).response = error?.response
          throw normalizedError
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

