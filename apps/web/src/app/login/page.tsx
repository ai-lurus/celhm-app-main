'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
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

  const handleMockLogin = (user: typeof mockUsers[0]) => {
    setIsLoading(true)
    setError(null)
    
    // Simulate login
    setTimeout(() => {
      // Store user in localStorage for demo
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', 'mock-token')
      setIsLoading(false)
      router.push('/dashboard')
    }, 1000)
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

          {isMockMode && (
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
          )}
        </div>
      </div>
    </div>
  )
}

