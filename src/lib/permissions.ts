import { Role } from '@celhm/types'

/**
 * Permisos por rol
 * Define qué acciones puede realizar cada rol
 * 
 * Acceso a secciones:
 * - Administrador: acceso completo
 * - Laboratorio: ventas, laboratorio, caja
 * - Recepcionista: ventas, catálogo, caja, clientes
 * - Todos pueden hacer ventas
 */
export const rolePermissions = {
  ADMINISTRADOR: {
    canViewDashboard: true,
    canViewReports: true,
    canViewFinancialReports: true,
    canManageSales: true,
    canManageCash: true,
    canManageTickets: true,
    canManageCustomers: true,
    canManageInventory: true,
    canManageCatalog: true,
    canDeleteOrders: true,
    canEditPrices: true,
    canViewAllBranches: true,
    canUpdateTickets: true,
    canManageSettings: true,
    canManageUsers: true,
    canManageCommissions: true,
  },
  ADMON: {
    canViewDashboard: true,
    canViewReports: true,
    canViewFinancialReports: true,
    canManageSales: true,
    canManageCash: true,
    canManageTickets: true,
    canManageCustomers: true,
    canManageInventory: true,
    canManageCatalog: true,
    canDeleteOrders: false,
    canEditPrices: true,
    canViewAllBranches: true,
    canUpdateTickets: true,
    canManageSettings: true,
    canManageUsers: true,
    canManageCommissions: true,
  },
  LABORATORIO: {
    canViewDashboard: false,
    canViewReports: false,
    canViewFinancialReports: false,
    canManageSales: true,
    canManageCash: true,
    canManageTickets: true,
    canManageCustomers: false,
    canManageInventory: false,
    canManageCatalog: false,
    canDeleteOrders: false,
    canEditPrices: false,
    canViewAllBranches: false,
    canUpdateTickets: true,
    canManageSettings: false,
    canManageUsers: false,
    canManageCommissions: false,
  },
  RECEPCIONISTA: {
    canViewDashboard: false,
    canViewReports: false,
    canViewFinancialReports: false,
    canManageSales: true,
    canManageCash: true,
    canManageTickets: false,
    canManageCustomers: true,
    canManageInventory: false,
    canManageCatalog: true,
    canDeleteOrders: false,
    canEditPrices: false,
    canViewAllBranches: false,
    canUpdateTickets: false,
    canManageSettings: false,
    canManageUsers: false,
    canManageCommissions: false,
  },
} as const

export type PermissionKey = keyof typeof rolePermissions.ADMINISTRADOR

/**
 * Mapa de rutas a permisos requeridos.
 * Si una ruta no está aquí, se permite a todos los usuarios autenticados.
 */
export const routePermissions: Record<string, PermissionKey> = {
  '/dashboard/laboratorio': 'canManageTickets',
  '/dashboard/sales': 'canManageSales',
  '/dashboard/cash': 'canManageCash',
  '/dashboard/customers': 'canManageCustomers',
  '/dashboard/catalog': 'canManageCatalog',
  '/dashboard/inventory': 'canManageCatalog',
  '/dashboard/reports': 'canViewFinancialReports',
  '/dashboard/users': 'canManageUsers',
  '/dashboard/settings': 'canManageSettings',
  '/dashboard/commissions': 'canManageCommissions',
}

/**
 * Ruta por defecto según el rol del usuario.
 * Los roles sin acceso al dashboard principal se redirigen a su sección.
 */
const roleDefaultRoutes: Record<string, string> = {
  LABORATORIO: '/dashboard/laboratorio',
  RECEPCIONISTA: '/dashboard/sales',
}

export function getDefaultRoute(role: Role): string {
  return roleDefaultRoutes[role] || '/dashboard'
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: Role, permission: PermissionKey): boolean {
  const permissions = rolePermissions[role]
  if (!permissions) {
    // Si el rol no está definido, denegar por defecto
    return false
  }
  return permissions[permission] ?? false
}

/**
 * Verifica si un rol tiene al menos uno de los permisos especificados
 */
export function hasAnyPermission(role: Role, ...permissions: PermissionKey[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Verifica si un rol tiene todos los permisos especificados
 */
export function hasAllPermissions(role: Role, ...permissions: PermissionKey[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getRolePermissions(role: Role): Record<PermissionKey, boolean> {
  return rolePermissions[role] || ({} as Record<PermissionKey, boolean>)
}

/**
 * Verifica si un rol puede acceder a una ruta del dashboard
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  // Check if trying to access the dashboard home
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return hasPermission(role, 'canViewDashboard')
  }
  // Check each route prefix
  for (const [route, permission] of Object.entries(routePermissions)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return hasPermission(role, permission)
    }
  }
  // Allow access to routes not explicitly defined
  return true
}
