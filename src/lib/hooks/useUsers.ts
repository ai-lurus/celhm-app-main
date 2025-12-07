import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { Role } from '@celhm/types'

export interface OrgMember {
  id: number
  organizationId: number
  userId: number
  role: Role
  user: {
    id: number
    name: string | null
    email: string | null
    role: Role
    branch: {
      id: number
      name: string
      code: string
    } | null
  }
  createdAt: string
  updatedAt: string
}

export interface User {
  id: number
  name: string | null
  email: string | null
  role: Role
  branchId: number | null
  branch: {
    id: number
    name: string
    code: string
  } | null
}

export function useUsers() {
  return useQuery({
    queryKey: ['users', 'members'],
    queryFn: async () => {
      const response = await api.get<OrgMember[]>('/orgs/members')
      return response.data
    },
    retry: false,
    onError: (error: any) => {
      console.error('Error loading users:', error)
    },
  })
}

// Note: Los siguientes hooks requieren endpoints en el backend que aún no existen
// Endpoints necesarios:
// - POST /orgs/members - Crear nuevo usuario/membresía
// - PATCH /orgs/members/:id - Actualizar rol/sucursal de usuario
// - DELETE /orgs/members/:id - Eliminar membresía (desactivar usuario)

