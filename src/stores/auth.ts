import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthUser, LoginRequest } from '@celhm/types'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'

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
          // 1. Authenticate with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          })

          if (error) throw error
          if (!data.session) throw new Error('No session returned from Supabase')

          const accessToken = data.session.access_token

          // 2. Set token temporarily so API interceptor can use it
          set({ token: accessToken })

          // 3. Get Internal User details from backend
          const response = await api.get<AuthUser>('/auth/me')
          const user = response.data

          set({
            user,
            token: accessToken,
            isLoading: false,
            error: null
          })
        } catch (error: any) {
          console.error('Login error:', error)
          let errorMessage = 'Error al iniciar sesión'

          if (error?.message) {
            errorMessage = error.message
            if (errorMessage === 'Invalid login credentials') {
              errorMessage = 'Credenciales inválidas'
            }
          }

          // Reset state on failure
          set({
            user: null,
            token: null,
            error: errorMessage,
            isLoading: false
          })

          throw new Error(errorMessage)
        }
      },

      checkSession: async () => {
        set({ isCheckingSession: true })

        try {
          // 1. Check Supabase Session
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error || !session) {
            throw new Error('No active Supabase session')
          }

          const accessToken = session.access_token

          // 2. Update token if it changed (or was null)
          set({ token: accessToken })

          // 3. Verify backend session and get fresh user data
          const response = await api.get<AuthUser>('/auth/me')
          const user = response.data

          set({
            user,
            token: accessToken,
            isCheckingSession: false
          })

          return true
        } catch (error: any) {
          // Token is invalid, expired, or user not found
          console.log('Session check failed:', error.message)

          // Ensure clear state
          get().logout()

          set({
            isCheckingSession: false
          })
          return false
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut()
        } catch (error) {
          console.error('Error signing out from Supabase:', error)
        }
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

