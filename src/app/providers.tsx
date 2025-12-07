'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: false, // Don't retry on error
        onError: (error: any) => {
          // Normalize errors to prevent rendering objects
          console.error('Query error:', error)
        },
      },
      mutations: {
        onError: (error: any) => {
          // Normalize errors to prevent rendering objects
          console.error('Mutation error:', error)
        },
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

