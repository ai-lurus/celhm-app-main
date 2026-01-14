'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/auth'
import { Sidebar } from '../../components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    // Check if user is authenticated
    // Only redirect if we're sure there's no session (after hydration)
    if (user === null && token === null) {
      router.push('/login')
    }
  }, [user, token, router])

  // Show loading only if we're still checking or if we have a token but no user yet
  if ((token && !user) || (user === null && token === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}