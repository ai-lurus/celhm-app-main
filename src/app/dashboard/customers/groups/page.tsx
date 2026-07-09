'use client'

import { useState } from 'react'
import {
  useCustomerGroups,
  useCreateCustomerGroup,
  useUpdateCustomerGroup,
  useDeleteCustomerGroup,
  CustomerGroup,
} from '../../../../lib/hooks/useCustomerGroups'
import { useToast } from '../../../../hooks/use-toast'
import { IconEdit, IconDelete, IconPlus } from '../../inventory/_components/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CustomerGroupsPage() {
  const pathname = usePathname()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [groupToEdit, setGroupToEdit] = useState<CustomerGroup | null>(null)
  const [name, setName] = useState('')
  const [discountPercent, setDiscountPercent] = useState('0')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<CustomerGroup | null>(null)

  const { data: groups = [] } = useCustomerGroups()
  const createGroup = useCreateCustomerGroup()
  const updateGroup = useUpdateCustomerGroup()
  const deleteGroup = useDeleteCustomerGroup()
  const isSaving = createGroup.isPending || updateGroup.isPending

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setGroupToEdit(null)
    setName('')
    setDiscountPercent('0')
    setIsModalOpen(true)
  }

  const openEditModal = (group: CustomerGroup) => {
    setGroupToEdit(group)
    setName(group.name)
    setDiscountPercent(String(group.discountPercent))
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
    setGroupToEdit(null)
    setName('')
    setDiscountPercent('0')
  }

  const errorMessage = (error: any, fallback: string) => {
    const rawMsg = error.response?.data?.message
    return typeof rawMsg === 'string' ? rawMsg : (error.message || fallback)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nombre requerido', description: 'Ingresa un nombre para el grupo.' })
      return
    }
    const parsedDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0))

    try {
      if (groupToEdit) {
        await updateGroup.mutateAsync({ id: groupToEdit.id, data: { name: name.trim(), discountPercent: parsedDiscount } })
        toast({ variant: 'success', title: 'Grupo actualizado', description: 'El grupo se ha actualizado correctamente.' })
      } else {
        await createGroup.mutateAsync({ name: name.trim(), discountPercent: parsedDiscount })
        toast({ variant: 'success', title: 'Grupo creado', description: 'El grupo se ha creado correctamente.' })
      }
      closeModal()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: errorMessage(error, 'Error al guardar grupo') })
    }
  }

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return
    try {
      await deleteGroup.mutateAsync(groupToDelete.id)
      toast({ variant: 'success', title: 'Grupo eliminado', description: 'El grupo se ha eliminado correctamente.' })
      setIsDeleteModalOpen(false)
      setGroupToDelete(null)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: errorMessage(error, 'Error al eliminar grupo') })
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground">Gestión de clientes y sus grupos de descuento</p>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <Link href="/dashboard/customers" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${pathname === '/dashboard/customers' ? 'border-blue-500 text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
            Clientes
          </Link>
          <Link href="/dashboard/customers/groups" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${pathname === '/dashboard/customers/groups' ? 'border-blue-500 text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
            Grupos
          </Link>
        </nav>
      </div>

      {/* Panel de Grupos */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Grupos de Clientes</h2>
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2">
            <IconPlus className="w-4 h-4" />
            <span>Agregar Grupo</span>
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar grupo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-2"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descuento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Clientes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">No hay grupos disponibles</td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => {
                    const isSystemGroup = group.isDefault || group.isFrequentBuyerTarget
                    return (
                      <tr key={group.id} className="hover:bg-muted">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-foreground">{group.name}</span>
                          {group.isFrequentBuyerTarget && (
                            <span className="ml-2 inline-flex text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Cliente frecuente</span>
                          )}
                          {group.isDefault && (
                            <span className="ml-2 inline-flex text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Predeterminado</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {group.discountPercent > 0 ? `${group.discountPercent}%` : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{group._count?.customers ?? 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button onClick={() => openEditModal(group)} title="Editar" className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors">
                              <IconEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => { setGroupToDelete(group); setIsDeleteModalOpen(true) }}
                              title={isSystemGroup ? 'Los grupos del sistema no se pueden eliminar' : 'Eliminar'}
                              disabled={isSystemGroup}
                              className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              <IconDelete className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Grupo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">{groupToEdit ? 'Editar Grupo' : 'Agregar Grupo'}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Mayorista"
                  className="w-full border border-border rounded-md px-3 py-2"
                  autoFocus
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Descuento (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="0"
                  className="w-full border border-border rounded-md px-3 py-2"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se aplica automáticamente en el POS al seleccionar un cliente de este grupo.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={closeModal} disabled={isSaving} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 flex items-center">
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (groupToEdit ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Grupo */}
      {isDeleteModalOpen && groupToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">Confirmar Eliminación</h2>
            <p className="text-muted-foreground mt-4">
              ¿Estás seguro de que deseas eliminar el grupo: <span className="font-medium">{groupToDelete.name}</span>?
              <br /><span className="text-xs text-amber-600">Debe estar vacío (sin clientes asignados).</span>
            </p>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={() => { setIsDeleteModalOpen(false); setGroupToDelete(null) }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
