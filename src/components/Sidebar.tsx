'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../stores/auth'
import { usePermissions } from '../lib/hooks/usePermissions'
import { PermissionKey } from '../lib/permissions'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

function SidebarThemeToggle() {
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
      className="w-full inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      aria-label="Alternar tema"
    >
      <Sun className="h-4 w-4 transition-transform dark:hidden" />
      <Moon className="hidden h-4 w-4 transition-transform dark:block" />
    </button>
  )
}

interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  permission?: PermissionKey
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export function Sidebar() {
  const pathname = usePathname() || ''
  const user = useAuthStore((state) => state.user)
  const { can } = usePermissions()

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', permission: undefined },
    { label: 'Tickets', href: '/dashboard/tickets', permission: 'canManageTickets' },
    { label: 'Clientes', href: '/dashboard/customers', permission: 'canManageCustomers' },
    { label: 'Ventas', href: '/dashboard/sales', permission: 'canManageSales' },
    { label: 'Catálogo', href: '/dashboard/inventory', permission: 'canManageInventory' },
    { label: 'Punto de Venta', href: '/dashboard/cash', permission: 'canManageCash' },
    { label: 'Reportes', href: '/dashboard/reports', permission: 'canViewFinancialReports' },
  ]

  const adminNavItems: NavItem[] = [
    { label: 'Usuarios', href: '/dashboard/users', permission: 'canViewAllBranches' },
    { label: 'Configuración de la Empresa', href: '/dashboard/settings', permission: undefined },
  ]

  const isActive = (href: string) => {
    if (!pathname || pathname === '') return false
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/'
    }
    return pathname.startsWith(href)
  }

  const filteredMainItems = mainNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )

  const filteredAdminItems = adminNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )

  return (
    <div className="w-64 bg-[#1e3a8a] h-full flex flex-col text-white">
      {/* Logo y Nombre de la Empresa */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg">CellPhone ERP Inc.</h1>
          </div>
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMainItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-blue-600 text-white font-medium'
                : 'text-blue-100 hover:bg-blue-800 hover:text-white'
            }`}
          >
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}

        {/* Sección de Administración */}
        {filteredAdminItems.length > 0 && (
          <>
            <div className="pt-6 pb-2">
              <h2 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                ADMINISTRACIÓN
              </h2>
            </div>
            {filteredAdminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-t border-blue-700 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name || 'Admin User'}
              </p>
              <p className="text-xs text-blue-300 truncate">
                {user.role || 'Admin'}
              </p>
            </div>
          </div>
          <div className="px-2">
            <SidebarThemeToggle />
          </div>
        </div>
      )}
    </div>
  )
}

