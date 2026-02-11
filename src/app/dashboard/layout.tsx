'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/auth'
import { Sidebar } from '../../components/Sidebar'
import { NotificationBell } from '../../components/NotificationBell'

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
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {/* Page title could go here, or just welcome message */}
            Panel de Control
          </h2>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            {/* User dropdown or other header items could go here */}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
