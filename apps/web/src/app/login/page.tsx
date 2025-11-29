'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/auth'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMockMode] = useState(process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true')

  const mockUsers = [
    {
      id: 1,
      email: 'direccion@acme-repair.com',
      name: 'Juan Pérez',
      role: 'DIRECCION',
      organizationId: 1,
      branchId: 1,
    },
    {
      id: 2,
      email: 'admon@acme-repair.com',
      name: 'María García',
      role: 'ADMON',
      organizationId: 1,
      branchId: 1,
    },
    {
      id: 3,
      email: 'laboratorio@acme-repair.com',
      name: 'Carlos López',
      role: 'LABORATORIO',
      organizationId: 1,
      branchId: 1,
    },
  ]

  const handleMockLogin = async (user: typeof mockUsers[0]) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Use real API login with seed credentials
      // All seed users have password: 'ChangeMe123!'
      await login({
        email: user.email,
        password: 'ChangeMe123!',
      })
      
      setIsLoading(false)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
      setIsLoading(false)
    }
  }

  const handleRealLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      await login({ email, password })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu cuenta de CELHM
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Credenciales
          </h3>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {isMockMode ? (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Modo Demo - Usuarios de prueba:
              </h4>
              <div className="space-y-2">
                {mockUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleMockLogin(user)}
                    disabled={isLoading}
                    className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      {user.role} - {user.email}
                    </div>
                  </button>
                ))}
              </div>
              
              {isLoading && (
                <div className="mt-4 text-center text-gray-600">
                  Iniciando sesión...
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleRealLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="direccion@acme-repair.com"
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
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ChangeMe123!"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

