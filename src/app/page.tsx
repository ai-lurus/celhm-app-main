'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../stores/auth'
import { getDefaultRoute } from '../lib/permissions'

export default function HomePage() {
  const router = useRouter()
  const { token, user, isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return

    if (token && user) {
      router.replace(getDefaultRoute(user.role))
    } else if (!token) {
      router.replace('/login')
    }
  }, [token, user, isHydrated, router])

  // Return empty div or minimal loading state to avoid flash of content
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

