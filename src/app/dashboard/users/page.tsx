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

const allRoles: Role[] = ['ADMINISTRADOR', 'LABORATORIO', 'RECEPCIONISTA']

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECEPCIONISTA' as Role,
    branchId: '',
  })

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
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
      case 'DIRECCION':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      case 'ADMON':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      case 'LABORATORIO':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      case 'TECNICO':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
      case 'RECEPCIONISTA':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const handleOpenCreate = () => {
    setNewUserForm({
      name: '',
      email: '',
      password: '',
      role: 'RECEPCIONISTA',
      branchId: branches.length > 0 ? branches[0].id.toString() : '',
    })
    setIsCreateModalOpen(true)
  }

  const handleCloseCreate = () => {
    setIsCreateModalOpen(false)
    setNewUserForm({
      name: '',
      email: '',
      password: '',
      role: 'RECEPCIONISTA',
      branchId: '',
    })
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement when endpoint is available
    alert('El endpoint de creación de usuarios no ha sido implementado en el backend aún')
    // try {
    //   await createUser.mutateAsync(newUserForm)
    //   handleCloseCreate()
    // } catch (error) {
    //   console.error('Error creating user:', error)
    // }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestionar miembros de la organización y permisos</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center space-x-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Nombre o correo..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role | '')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando usuarios...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No se encontraron usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sucursal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Registrado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMembers.map((member: OrgMember) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {member.user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.user.name || 'Sin nombre'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">{member.user.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                        {formatRole(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {member.user.branch ? `${member.user.branch.name} (${member.user.branch.code})` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenView(member)}
                          title="Ver Detalles"
                          className="p-2 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <IconView className="w-5 h-5" />
                        </button>
                        <button
                          disabled
                          title="Editar (Endpoint no disponible)"
                          className="p-2 rounded-md text-gray-400 dark:text-gray-500 cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalles del Usuario</h2>

            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {viewingMember.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {viewingMember.user.name || 'Sin nombre'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{viewingMember.user.email || '-'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-600 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{viewingMember.user.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Rol</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(viewingMember.role)}`}>
                    {formatRole(viewingMember.role)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Sucursal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {viewingMember.user.branch ? `${viewingMember.user.branch.name} (${viewingMember.user.branch.code})` : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Registrado</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(viewingMember.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Nota:</strong> Para editar o crear usuarios, los siguientes endpoints deben ser implementados en el backend:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 list-disc list-inside">
                <li>POST /orgs/members - Crear nuevo usuario</li>
                <li>PATCH /orgs/members/:id - Actualizar rol/sucursal</li>
                <li>DELETE /orgs/members/:id - Eliminar membresía</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={handleCloseView}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agregar Nuevo Usuario</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa el nombre de usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa la contraseña"
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol
                  </label>
                  <select
                    required
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as Role })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allRoles.map((role: Role) => (
                      <option key={role} value={role}>
                        {formatRole(role)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sucursal
                  </label>
                  <select
                    value={newUserForm.branchId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, branchId: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin sucursal</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Nota:</strong> El endpoint de creación de usuarios (POST /orgs/members) necesita ser implementado en el backend.
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCreate}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


