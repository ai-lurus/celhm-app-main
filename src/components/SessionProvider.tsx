'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/auth'

/**
 * Component that verifies the session on app load
 * and handles session persistence
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { token, isHydrated, isCheckingSession, checkSession } = useAuthStore()
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    // Only check session after hydration is complete
    if (!isHydrated) {
      return
    }

    // Only check once on mount if there's a token
    if (token && !hasCheckedRef.current) {
      hasCheckedRef.current = true
      checkSession()
    } else if (!token) {
      // If no token, mark as checked to avoid re-checking
      hasCheckedRef.current = true
    }
  }, [isHydrated, token, checkSession])

  // Show loading state only while hydrating or checking session for the first time
  if (!isHydrated || (isCheckingSession && !hasCheckedRef.current)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

