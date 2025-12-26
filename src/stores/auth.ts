import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthUser, LoginRequest, LoginResponse } from '@celhm/types'
import { api } from '../lib/api'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  isHydrated: boolean
  isCheckingSession: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
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

      checkSession: async () => {
        const { token } = get()
        
        // If no token, no session to check
        if (!token) {
          set({ user: null, token: null, isCheckingSession: false })
          return false
        }

        set({ isCheckingSession: true })
        
        try {
          // Verify token by calling /auth/me
          const response = await api.get<AuthUser>('/auth/me')
          const user = response.data
          
          // Update user data in case it changed
          set({ 
            user, 
            isCheckingSession: false 
          })
          
          return true
        } catch (error: any) {
          // Token is invalid or expired
          console.log('Session check failed, clearing auth state')
          set({ 
            user: null, 
            token: null, 
            error: null,
            isCheckingSession: false 
          })
          return false
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after rehydration
        if (state) {
          state.setHydrated()
        }
      },
    }
  )
)

