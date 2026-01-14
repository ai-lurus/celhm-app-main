'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../stores/auth'

export default function HomePage() {
  const router = useRouter()
  const { token, isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return

    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [token, isHydrated, router])

  // Return empty div or minimal loading state to avoid flash of content
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

