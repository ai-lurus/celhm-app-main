'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../../stores/auth'
import { usePermissions } from '../../lib/hooks/usePermissions'
// Removed @celhm/ui import for now
import Link from 'next/link'
import { ThemeToggle } from '../../components/theme-toggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const { can } = usePermissions()

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

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const baseNavLink = 'px-3 py-2 rounded-md text-sm font-medium transition-colors'
  const activeNavLink = 'text-primary bg-primary/10 border-b-2 border-primary'
  const inactiveNavLink = 'text-muted-foreground hover:text-foreground hover:bg-muted'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold">
                CELHM
              </Link>
              <div className="ml-10 flex space-x-8">
                <Link
                  href="/dashboard"
                  className={`${baseNavLink} ${
                    pathname === '/dashboard' || pathname === '/dashboard/'
                      ? activeNavLink
                      : inactiveNavLink
                  }`}
                >
                  Dashboard
                </Link>
                {can('canManageTickets') && (
                  <Link
                    href="/dashboard/tickets"
                    className={`${baseNavLink} ${
                      pathname.startsWith('/dashboard/tickets')
                        ? activeNavLink
                        : inactiveNavLink
                    }`}
                  >
                    Tickets
                  </Link>
                )}
                {can('canManageCustomers') && (
                  <Link
                    href="/dashboard/customers"
                    className={`${baseNavLink} ${
                      pathname.startsWith('/dashboard/customers')
                        ? activeNavLink
                        : inactiveNavLink
                    }`}
                  >
                    Clientes
                  </Link>
                )}
                {can('canManageSales') && (
                  <Link
                    href="/dashboard/sales"
                    className={`${baseNavLink} ${
                      pathname.startsWith('/dashboard/sales')
                        ? activeNavLink
                        : inactiveNavLink
                    }`}
                  >
                    Ventas
                  </Link>
                )}
                {can('canManageInventory') && (
                  <Link
                    href="/dashboard/inventory"
                    className={`${baseNavLink} ${
                      pathname.startsWith('/dashboard/inventory')
                        ? activeNavLink
                        : inactiveNavLink
                    }`}
                  >
                    Inventario
                  </Link>
                )}
                {can('canManageCatalog') && (
                  <Link
                    href="/dashboard/catalog"
                    className={`${baseNavLink} ${
                      pathname.startsWith('/dashboard/catalog')
                        ? activeNavLink
                        : inactiveNavLink
                    }`}
                  >
                    Catálogo
                  </Link>
                )}
                {can('canManageCash') && (
                  <Link
                    href="/dashboard/cash"
                    className={`${baseNavLink} ${
                      pathname.startsWith('/dashboard/cash')
                        ? activeNavLink
                        : inactiveNavLink
                    }`}
                  >
                    Caja
                  </Link>
                )}
                {can('canViewFinancialReports') && (
                  <Link
                    href="/dashboard/reports"
                    className={`${baseNavLink} ${
                      pathname.startsWith('/dashboard/reports')
                        ? activeNavLink
                        : inactiveNavLink
                    }`}
                  >
                    Reportes
                  </Link>
                )}
                {can('canViewAllBranches') && (
                  <Link
                    href="/dashboard/users"
                    className={`${baseNavLink} ${
                      pathname.startsWith('/dashboard/users')
                        ? activeNavLink
                        : inactiveNavLink
                    }`}
                  >
                    Usuarios
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-sm text-foreground">
                {user.name} ({user.role})
              </span>
              <button 
                className="bg-background hover:bg-muted text-foreground font-medium py-2 px-4 rounded-md border border-border text-sm"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

