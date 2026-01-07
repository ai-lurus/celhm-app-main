'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { SessionProvider } from '../components/SessionProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: false, // Don't retry on error
      },
      mutations: {
        retry: false,
      },
    },
  }))

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
<<<<<<< HEAD
        {children}
=======
        <SessionProvider>
          {children}
        </SessionProvider>
>>>>>>> e20c642b9d44dc10eae7eac8fbb7a8e447d37ac1
      </QueryClientProvider>
    </ThemeProvider>
  )
}

