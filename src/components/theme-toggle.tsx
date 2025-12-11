'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const currentTheme = resolvedTheme ?? theme ?? 'light'
  const toggle = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark')

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
      aria-label="Alternar tema"
    >
      <Sun className="h-4 w-4 transition-transform dark:hidden" />
      <Moon className="hidden h-4 w-4 transition-transform dark:block" />
    </button>
  )
}


