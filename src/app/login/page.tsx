'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/api'

type View = 'login' | 'forgot-password'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isHydrated && user && token) {
      router.push('/dashboard')
    }
  }, [isHydrated, user, token, router])

  if (!isHydrated || (user && token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login({ email, password })
      router.push('/dashboard')
    } catch (err: unknown) {
      let errorMessage = 'Error al iniciar sesión'
      if (
        err &&
        typeof err === 'object' &&
        'response' in err
      ) {
        const response = (err as { response?: { data?: { message?: unknown } } }).response
        const message = response?.data?.message
        if (typeof message === 'string') {
          errorMessage = message
        } else if (Array.isArray(message)) {
          errorMessage = message.join(', ')
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await api.post('/auth/forgot-password', { email: forgotEmail })
      setSuccessMessage('Si el correo existe, recibirás una contraseña temporal en tu bandeja de entrada.')
      setForgotEmail('')
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const switchToForgot = () => {
    setView('forgot-password')
    setError(null)
    setSuccessMessage(null)
  }

  const switchToLogin = () => {
    setView('login')
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {view === 'login' ? 'Iniciar Sesión' : 'Recuperar Contraseña'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            CELHM - Sistema de Gestión de Reparaciones
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4">
              {successMessage}
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <p className="text-sm text-gray-600">
                Ingresa tu correo y te enviaremos una contraseña temporal.
              </p>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Enviando...' : 'Enviar contraseña temporal'}
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
