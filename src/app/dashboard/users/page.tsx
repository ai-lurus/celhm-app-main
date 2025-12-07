'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUsers, OrgMember } from '../../../lib/hooks/useUsers'
import { useBranches } from '../../../lib/hooks/useBranches'
import { useAuthStore } from '../../../stores/auth'
import { usePermissions } from '../../../lib/hooks/usePermissions'
import { Role } from '@celhm/types'

// Iconos
const IconEdit = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const IconView = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const allRoles: Role[] = ['ADMINISTRADOR', 'DIRECCION', 'ADMON', 'LABORATORIO', 'TECNICO', 'RECEPCIONISTA']

const formatRole = (role: Role) => {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export default function UsersPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { can } = usePermissions()
  const { data: members, isLoading } = useUsers()
  const { data: branches = [] } = useBranches()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | ''>('')
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingMember, setViewingMember] = useState<OrgMember | null>(null)

  // Proteger la página - solo administradores
  useEffect(() => {
    if (user && !can('canViewAllBranches')) {
      router.push('/dashboard')
    }
  }, [user, can, router])

  if (!user || !can('canViewAllBranches')) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Acceso Denegado</h2>
          <p className="text-red-600">Solo los administradores pueden gestionar usuarios.</p>
        </div>
      </div>
    )
  }

  const filteredMembers = (members || []).filter((member: OrgMember) => {
    const user = member.user
    const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const roleMatch = selectedRole === '' || member.role === selectedRole
    return (nameMatch || emailMatch) && roleMatch
  })

  const handleOpenView = (member: OrgMember) => {
    setViewingMember(member)
    setIsViewModalOpen(true)
  }

  const handleCloseView = () => {
    setIsViewModalOpen(false)
    setViewingMember(null)
  }

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'bg-purple-100 text-purple-800'
      case 'DIRECCION':
        return 'bg-blue-100 text-blue-800'
      case 'ADMON':
        return 'bg-green-100 text-green-800'
      case 'LABORATORIO':
        return 'bg-yellow-100 text-yellow-800'
      case 'TECNICO':
        return 'bg-orange-100 text-orange-800'
      case 'RECEPCIONISTA':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administrar usuarios de la organización</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Los endpoints para crear/editar usuarios aún no están implementados en el backend.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Nombre o email..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role | '')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos los roles</option>
              {allRoles.map((role: Role) => (
                <option key={role} value={role}>
                  {formatRole(role)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay usuarios registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sucursal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.user.name || 'Sin nombre'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.user.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                        {formatRole(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.user.branch ? `${member.user.branch.name} (${member.user.branch.code})` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOpenView(member)}
                          title="Ver Detalles"
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                        >
                          <IconView className="w-5 h-5" />
                        </button>
                        {/* Botón de editar deshabilitado hasta que exista el endpoint */}
                        <button
                          disabled
                          title="Editar (Endpoint no disponible)"
                          className="p-1 rounded-md text-gray-400 cursor-not-allowed"
                        >
                          <IconEdit className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ver Detalles */}
      {isViewModalOpen && viewingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Detalles del Usuario</h2>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">ID</span>
                <span className="font-medium text-gray-900">{viewingMember.user.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Nombre</span>
                <span className="font-medium text-gray-900">{viewingMember.user.name || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{viewingMember.user.email || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Rol</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(viewingMember.role)}`}>
                  {formatRole(viewingMember.role)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Sucursal</span>
                <span className="font-medium text-gray-900">
                  {viewingMember.user.branch ? `${viewingMember.user.branch.name} (${viewingMember.user.branch.code})` : '-'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Fecha de Registro</span>
                <span className="font-medium text-gray-900">
                  {new Date(viewingMember.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Para editar o crear usuarios, se necesitan implementar los siguientes endpoints en el backend:
              </p>
              <ul className="text-xs text-yellow-700 mt-2 list-disc list-inside">
                <li>POST /orgs/members - Crear nuevo usuario</li>
                <li>PATCH /orgs/members/:id - Actualizar rol/sucursal</li>
                <li>DELETE /orgs/members/:id - Eliminar membresía</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={handleCloseView}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

