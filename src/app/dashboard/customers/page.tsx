'use client'

import React, { useState } from 'react'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, Customer } from '../../../lib/hooks/useCustomers'
import { usePermissions } from '../../../lib/hooks/usePermissions'

// Iconos
const IconEdit = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const IconDelete = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.54 0c-.27 0-.537.019-.804.055l-3.478.397m14.456 0l3.478-.397m9.064 0l-3.478-.397M9.26 9v9.969" />
  </svg>
)

const IconView = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

interface CustomerForm {
  name: string
  phone: string
  email: string
  notes: string
}

interface FilterNode {
  id: number;
  name: string;
  children?: FilterNode[];
}

// Datos de filtros (placeholder). Reemplazar con datos reales cuando esté la API.
const filtersData: { locations: { data: FilterNode[] } } = {
  locations: { data: [] },
};

export default function CustomersPage() {
  const { can } = usePermissions()
  // ---Estados busqueda---
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  
  // ---Estados filtro arbol---
  const [filterPath, setFilterPath] = useState<number[]>([]); 
  const [selectedType, setSelectedType] = useState('');
  //---Estados modales---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })

  const { data: customersData, isLoading } = useCustomers({ q: searchTerm, page, pageSize: 20 })
  const customers = Array.isArray((customersData as any)?.data) ? (customersData as any).data : []
  const pagination = (customersData as any)?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 }
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const handleFilterChange = (level: number, id: string) => {
    const newPath = filterPath.slice(0, level);
    if (id) newPath.push(parseInt(id));
    setFilterPath(newPath);
    setPage(1); // Resetear página al filtrar
  };

  const renderFilterSelectors = () => {
    const selectors: React.ReactElement[] = [];
    let currentOptions: FilterNode[] | undefined = filtersData.locations.data;

    if (currentOptions) {
      const rootOptions = currentOptions ?? [];
      selectors.push(
        <div key={0} className="mb-3">
          <label className="block text-sm font-medium text-foreground mb-1">Región</label>
          <select 
            onChange={(e) => handleFilterChange(0, e.target.value)} 
            value={filterPath[0] || ''} 
            className="w-full px-3 py-2 border border-border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Todas</option>
            {rootOptions.map((opt: FilterNode) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>
      );
    }

    for (let i = 0; i < filterPath.length; i++) {
      if (!currentOptions) break;
      const selectedId = filterPath[i];
      const selectedNode: FilterNode | undefined = currentOptions.find((opt: FilterNode) => opt.id === selectedId);
      
      if (selectedNode?.children && selectedNode.children.length > 0) {
        currentOptions = selectedNode.children;
        const options = currentOptions ?? [];
        selectors.push(
          <div key={i + 1} className="mb-3">
            <label className="block text-sm font-medium text-foreground mb-1">{`Sub-zona ${i + 1}`}</label>
            <select 
              onChange={(e) => handleFilterChange(i + 1, e.target.value)} 
              value={filterPath[i + 1] || ''} 
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todas</option>
              {options.map((opt: FilterNode) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
            </select>
          </div>
        );
      } else {
        currentOptions = undefined;
      }
    }
    return selectors;
  };
  
  const handleOpenCreate = () => {
    setEditingCustomer(null)
    setFormData({ name: '', phone: '', email: '', notes: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleOpenView = (customer: Customer) => {
    setViewingCustomer(customer)
    setIsViewModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
    setFormData({ name: '', phone: '', email: '', notes: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({
          id: editingCustomer.id,
          data: formData,
        })
      } else {
        await createCustomer.mutateAsync(formData)
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error al guardar el cliente:', error)
      alert('Error al guardar el cliente. Por favor intenta nuevamente.')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteCustomer.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar al cliente:', error)
        alert('Error al eliminar el cliente.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tus clientes</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Nuevo Cliente
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* --- COLUMNA IZQUIERDA --- */}
        <div className="w-full md:w-1/4">
          <div className="bg-card p-4 rounded-lg shadow space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Filtros</h3>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            <div className="space-y-2">
              {renderFilterSelectors()}
            </div>
          </div>
        </div>

        {/* --- TABLA DERECHA --- */}
        <div className="w-full md:w-3/4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                      No hay clientes registrados
                    </td>
                  </tr>
                ) : (
                  customers.map((customer: Customer) => (
                    <tr key={customer.id} className="hover:bg-muted">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{customer.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {customer.notes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleOpenView(customer)}
                            className="text-primary hover:text-blue-900"
                            title="Ver detalles"
                          >
                            <IconView />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <IconEdit />
                          </button>
                          {can('canDeleteOrders') && (
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <IconDelete />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-muted px-6 py-3 flex items-center justify-between border-t border-border">
              <div className="text-sm text-foreground">
                Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, pagination.total)} de {pagination.total}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createCustomer.isPending || updateCustomer.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createCustomer.isPending || updateCustomer.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {isViewModalOpen && viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Detalles del Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Nombre</label>
                <p className="mt-1 text-sm text-foreground">{viewingCustomer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Teléfono</label>
                <p className="mt-1 text-sm text-foreground">{viewingCustomer.phone}</p>
              </div>
              {viewingCustomer.email && (
                <div>
                  <label className="block text-sm font-medium text-foreground">Email</label>
                  <p className="mt-1 text-sm text-foreground">{viewingCustomer.email}</p>
                </div>
              )}
              {viewingCustomer.notes && (
                <div>
                  <label className="block text-sm font-medium text-foreground">Notas</label>
                  <p className="mt-1 text-sm text-foreground">{viewingCustomer.notes}</p>
                </div>
              )}
              {viewingCustomer.tickets && viewingCustomer.tickets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground">Órdenes de Reparación</label>
                  <p className="mt-1 text-sm text-foreground">{viewingCustomer.tickets.length} órdenes</p>
                </div>
              )}
              {viewingCustomer.sales && viewingCustomer.sales.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground">Ventas</label>
                  <p className="mt-1 text-sm text-foreground">{viewingCustomer.sales.length} ventas</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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


