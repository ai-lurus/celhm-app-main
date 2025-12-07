import { useAuthStore } from '../../stores/auth'
import { hasPermission, hasAnyPermission, hasAllPermissions, getRolePermissions, PermissionKey } from '../permissions'
import { Role } from '@celhm/types'

/**
 * Hook para verificar permisos del usuario actual
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user)

  const checkPermission = (permission: PermissionKey): boolean => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }

  const checkAnyPermission = (...permissions: PermissionKey[]): boolean => {
    if (!user) return false
    return hasAnyPermission(user.role, ...permissions)
  }

  const checkAllPermissions = (...permissions: PermissionKey[]): boolean => {
    if (!user) return false
    return hasAllPermissions(user.role, ...permissions)
  }

  const permissions = user ? getRolePermissions(user.role) : null

  return {
    user,
    role: user?.role,
    permissions,
    can: checkPermission,
    canAny: checkAnyPermission,
    canAll: checkAllPermissions,
  }
}

