import { Role } from '@celhm/types'

/**
 * Permisos por rol
 * Define qué acciones puede realizar cada rol
 */
export const rolePermissions = {
  ADMINISTRADOR: {
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
  },
  ADMON: {
    canViewReports: true,
    canViewFinancialReports: true,
    canManageSales: true,
    canManageCash: true,
    canManageTickets: true,
    canManageCustomers: true,
    canManageInventory: true,
    canManageCatalog: true,
    canDeleteOrders: false, // No puede borrar órdenes, solo cancelarlas
    canEditPrices: true,
    canViewAllBranches: true,
    canUpdateTickets: true,
    canManageSettings: true,
  },
  LABORATORIO: {
    canViewReports: false,
    canViewFinancialReports: false,
    canManageSales: false,
    canManageCash: false,
    canManageTickets: true,
    canManageCustomers: false,
    canManageInventory: false,
    canManageCatalog: false,
    canDeleteOrders: false,
    canEditPrices: false,
    canViewAllBranches: false,
    canUpdateTickets: true,
    canManageSettings: false,
  },
  RECEPCIONISTA: {
    canViewReports: false,
    canViewFinancialReports: false,
    canManageSales: true,
    canManageCash: false,
    canManageTickets: true, // Solo crear/ver tickets
    canManageCustomers: true,
    canManageInventory: false,
    canManageCatalog: false,
    canDeleteOrders: false,
    canEditPrices: false,
    canViewAllBranches: false,
    canUpdateTickets: false,
    canManageSettings: false,
  },
} as const

export type PermissionKey = keyof typeof rolePermissions.ADMINISTRADOR

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
