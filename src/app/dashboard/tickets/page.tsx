'use client'

import { useState } from 'react'
import { useTickets, useCreateTicket, useUpdateTicket, useUpdateTicketState, useTicket } from '../../../lib/hooks/useTickets'
import { useBranches } from '../../../lib/hooks/useBranches'
import { useAuthStore } from '../../../stores/auth'
import { Ticket, TicketState } from '@celhm/types'

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

const IconMovement = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
)

const allStates: TicketState[] = [
  'RECIBIDO',
  'DIAGNOSTICO',
  'ESPERANDO_PIEZA',
  'EN_REPARACION',
  'REPARADO',
  'ENTREGADO',
  'CANCELADO',
]

interface TicketForm {
  customerName: string
  customerPhone: string
  customerEmail: string
  device: string
  brand: string
  model: string
  serialNumber: string
  problem: string
  diagnosis: string
  estimatedCost: number
  finalCost: number
  estimatedTime: number
  advancePayment: number
  internalNotes: string
}

const initialFormState: TicketForm = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  device: '',
  brand: '',
  model: '',
  serialNumber: '',
  problem: '',
  diagnosis: '',
  estimatedCost: 0,
  finalCost: 0,
  estimatedTime: 1,
  advancePayment: 0,
  internalNotes: '',
}

interface StatusForm {
  state: TicketState
  diagnosis: string
  solution: string
  estimatedCost: number
  finalCost: number
  notes: string
}

export default function TicketsPage() {
  const user = useAuthStore((state) => state.user)
  const { data: branches = [] } = useBranches()
  const branchId = user?.branchId || (branches.length > 0 ? branches[0].id : 1)

  const [selectedState, setSelectedState] = useState<TicketState | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [activeView, setActiveView] = useState<'kanban' | 'table'>('kanban')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [statusTicket, setStatusTicket] = useState<Ticket | null>(null)
  const [viewingTicketId, setViewingTicketId] = useState<number | null>(null)

  const [formData, setFormData] = useState<TicketForm>(initialFormState)
  const [statusForm, setStatusForm] = useState<StatusForm>({
    state: 'RECIBIDO',
    diagnosis: '',
    solution: '',
    estimatedCost: 0,
    finalCost: 0,
    notes: '',
  })

  // API hooks
  const { data: ticketsData, isLoading } = useTickets({
    estado: selectedState || undefined,
    q: searchTerm || undefined,
    page,
    pageSize: 50,
  })

  const { data: viewingTicket } = useTicket(viewingTicketId || 0)

  const createTicket = useCreateTicket()
  const updateTicket = useUpdateTicket()
  const updateTicketState = useUpdateTicketState()

  const tickets = ticketsData?.data || []

  const handleOpenCreate = () => {
    setEditingTicket(null)
    setFormData(initialFormState)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setFormData({
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone || '',
      customerEmail: ticket.customerEmail || '',
      device: ticket.device,
      brand: ticket.brand || '',
      model: ticket.model || '',
      serialNumber: ticket.serialNumber || '',
      problem: ticket.problem,
      diagnosis: ticket.diagnosis || '',
      estimatedCost: ticket.estimatedCost || 0,
      finalCost: ticket.finalCost || 0,
      estimatedTime: ticket.estimatedTime || 1,
      advancePayment: ticket.advancePayment || 0,
      internalNotes: ticket.internalNotes || '',
    })
    setIsModalOpen(true)
  }

  const handleOpenStatus = (ticket: Ticket) => {
    setStatusTicket(ticket)
    setStatusForm({
      state: ticket.state,
      diagnosis: ticket.diagnosis || '',
      solution: ticket.solution || '',
      estimatedCost: ticket.estimatedCost || 0,
      finalCost: ticket.finalCost || 0,
      notes: '',
    })
    setIsStatusModalOpen(true)
  }

  const handleOpenView = (ticket: Ticket) => {
    setViewingTicketId(ticket.id)
    setIsViewModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTicket(null)
    setFormData(initialFormState)
  }

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false)
    setStatusTicket(null)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setViewingTicketId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customerName || !formData.device || !formData.problem) {
      alert('Por favor, completa Nombre del Cliente, Dispositivo y Problema.')
      return
    }

    try {
      if (editingTicket) {
        await updateTicket.mutateAsync({
          id: editingTicket.id,
          data: {
            customerName: formData.customerName,
            customerPhone: formData.customerPhone || undefined,
            customerEmail: formData.customerEmail || undefined,
            device: formData.device,
            brand: formData.brand || undefined,
            model: formData.model || undefined,
            serialNumber: formData.serialNumber || undefined,
            problem: formData.problem,
            diagnosis: formData.diagnosis || undefined,
            estimatedCost: formData.estimatedCost || undefined,
            finalCost: formData.finalCost || undefined,
            estimatedTime: formData.estimatedTime || undefined,
            internalNotes: formData.internalNotes || undefined,
          },
        })
      } else {
        await createTicket.mutateAsync({
          branchId,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone || undefined,
          customerEmail: formData.customerEmail || undefined,
          device: formData.device,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          serialNumber: formData.serialNumber || undefined,
          problem: formData.problem,
          diagnosis: formData.diagnosis || undefined,
          estimatedCost: formData.estimatedCost || undefined,
          estimatedTime: formData.estimatedTime || undefined,
          advancePayment: formData.advancePayment || undefined,
          internalNotes: formData.internalNotes || undefined,
        })
      }
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving ticket:', error)
      alert(error?.message || 'Error al guardar el ticket')
    }
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statusTicket) return

    // Validación RF-ORD-08: No entregar si no está pagado
    if (statusForm.state === 'ENTREGADO') {
      const totalPaid = statusTicket.advancePayment || 0
      const finalCost = statusForm.finalCost || statusTicket.finalCost || statusTicket.estimatedCost || 0
      
      if (totalPaid < finalCost) {
        alert(`No se puede marcar como ENTREGADO. El ticket tiene un costo de $${finalCost.toLocaleString()} pero solo se ha pagado $${totalPaid.toLocaleString()}. Falta pagar $${(finalCost - totalPaid).toLocaleString()}.`)
        return
      }
    }

    try {
      await updateTicketState.mutateAsync({
        id: statusTicket.id,
        data: {
          state: statusForm.state,
          diagnosis: statusForm.diagnosis || undefined,
          solution: statusForm.solution || undefined,
          estimatedCost: statusForm.estimatedCost || undefined,
          finalCost: statusForm.finalCost || undefined,
          notes: statusForm.notes || undefined,
        },
      })
      handleCloseStatusModal()
    } catch (error: any) {
      console.error('Error updating ticket status:', error)
      alert(error?.message || 'Error al actualizar el estado del ticket')
    }
  }

  const getStateColor = (state: TicketState) => {
    switch (state) {
      case 'RECIBIDO':
        return 'bg-blue-100 text-blue-800'
      case 'DIAGNOSTICO':
        return 'bg-purple-100 text-purple-800'
      case 'ESPERANDO_PIEZA':
        return 'bg-orange-100 text-orange-800'
      case 'EN_REPARACION':
        return 'bg-yellow-100 text-yellow-800'
      case 'REPARADO':
        return 'bg-green-100 text-green-800'
      case 'ENTREGADO':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatState = (state: TicketState) => {
    return state.charAt(0) + state.slice(1).toLowerCase().replace('_', ' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600">Gestión de tickets de reparación</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Nuevo Ticket
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* Filtros */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Filtros</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Folio, cliente, dispositivo..."
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value as TicketState | '')
                  setPage(1)
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos los estados</option>
                {allStates.map((state) => (
                  <option key={state} value={state}>
                    {formatState(state)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="w-full md:w-3/4 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveView('kanban')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'kanban'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vista Kanban
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'table'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lista
              </button>
            </nav>
          </div>
          
          {isLoading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              Cargando tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No hay tickets registrados
            </div>
          ) : activeView === 'kanban' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {['RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION', 'REPARADO'].map((state) => {
                const stateTickets = tickets.filter((ticket) => ticket.state === state)
                return (
                  <div key={state} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">{formatState(state as TicketState)}</h3>
                      <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                        {stateTickets.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {stateTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm font-medium text-gray-900">{ticket.folio}</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(ticket.state)}`}>
                              {formatState(ticket.state)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{ticket.customerName}</p>
                              <p className="text-xs text-gray-500">{ticket.customerPhone || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">
                                {ticket.device} {ticket.brand ? `- ${ticket.brand}` : ''}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{ticket.problem}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Est: ${(ticket.estimatedCost || 0).toLocaleString()}</span>
                              <span>{ticket.estimatedTime || 0} días</span>
                            </div>
                          </div>
                          <div className="mt-3 flex space-x-2">
                            <button 
                              onClick={() => handleOpenView(ticket)}
                              title="Ver Detalle"
                              className="flex-1 flex justify-center p-1 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                            >
                              <IconView className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(ticket)}
                              title="Editar"
                              className="flex-1 flex justify-center p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"
                            >
                              <IconEdit className="w-5 h-5" />
                            </button>
                             <button 
                              onClick={() => handleOpenStatus(ticket)}
                              title="Cambiar Estado"
                              className="flex-1 flex justify-center p-1 rounded-md text-purple-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                            >
                              <IconMovement className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {stateTickets.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No hay tickets en este estado
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispositivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problema</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Est.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.folio}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ticket.customerName}</div>
                          <div className="text-sm text-gray-500">{ticket.customerPhone || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ticket.device}</div>
                          <div className="text-sm text-gray-500">
                            {ticket.brand || ''} {ticket.model ? `- ${ticket.model}` : ''}
                          </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{ticket.problem}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(ticket.state)}`}>
                          {formatState(ticket.state)}
                          </span>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(ticket.estimatedCost || 0).toLocaleString()}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <div className="flex items-center space-x-3">
                              <button 
                            onClick={() => handleOpenView(ticket)}
                                title="Ver"
                                className="p-1 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                              >
                                <IconView className="w-5 h-5" />
                              </button>
                              <button 
                            onClick={() => handleOpenEdit(ticket)}
                                title="Editar"
                                className="p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"
                              >
                                <IconEdit className="w-5 h-5" />
                              </button>
                              <button 
                            onClick={() => handleOpenStatus(ticket)}
                                title="Cambiar Estado"
                                className="p-1 rounded-md text-purple-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                              >
                                <IconMovement className="w-5 h-5" />
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
      </div>

      {/* Modal Crear/Editar Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingTicket ? 'Editar Ticket' : 'Crear Nuevo Ticket'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dispositivo *</label>
                    <input
                      type="text"
                      required
                      value={formData.device}
                      onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Ej: iPhone 12"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Ej: Apple"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Ej: A2403"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie / IMEI</label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
              </div>
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Problema Reportado *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.problem}
                      onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Ej: Pantalla rota, no enciende..."
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                    <textarea
                      rows={3}
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Diagnóstico técnico..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo Estimado ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  {editingTicket && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo Final ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.finalCost}
                        onChange={(e) => setFormData({ ...formData, finalCost: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Estimado (días)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  {!editingTicket && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Anticipo ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.advancePayment}
                        onChange={(e) => setFormData({ ...formData, advancePayment: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas Internas</label>
                    <textarea
                      rows={3}
                      value={formData.internalNotes}
                      onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Notas visibles solo para el personal..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createTicket.isPending || updateTicket.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                >
                  {createTicket.isPending || updateTicket.isPending
                    ? 'Guardando...'
                    : editingTicket
                    ? 'Actualizar Ticket'
                    : 'Guardar Ticket'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal Cambiar Estado */}
      {isStatusModalOpen && statusTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900">Cambiar Estado del Ticket</h2>
            <div className="mt-4">
              <p className="font-medium">{statusTicket.folio}</p>
              <p className="text-sm text-gray-500">{statusTicket.customerName}</p>
            </div>
            <form onSubmit={handleUpdateStatus} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Estado</label>
                <select 
                  value={statusForm.state}
                  onChange={(e) => setStatusForm({ ...statusForm, state: e.target.value as TicketState })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {allStates.map((state) => (
                    <option key={state} value={state}>
                      {formatState(state)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <textarea
                  rows={3}
                  value={statusForm.diagnosis}
                  onChange={(e) => setStatusForm({ ...statusForm, diagnosis: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solución</label>
                <textarea
                  rows={3}
                  value={statusForm.solution}
                  onChange={(e) => setStatusForm({ ...statusForm, solution: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Estimado ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={statusForm.estimatedCost}
                  onChange={(e) => setStatusForm({ ...statusForm, estimatedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Final ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={statusForm.finalCost}
                  onChange={(e) => setStatusForm({ ...statusForm, finalCost: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button 
                  type="button"
                  onClick={handleCloseStatusModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
                >
                Cancelar
              </button>
              <button 
                  type="submit"
                  disabled={updateTicketState.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                >
                  {updateTicketState.isPending ? 'Actualizando...' : 'Actualizar Estado'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal Ver Detalles */}
      {isViewModalOpen && viewingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Detalles del Ticket</h2>
            
            <div className="space-y-3 pt-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Folio</span>
                <span className="font-medium text-gray-900">{viewingTicket.folio}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Estado</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(viewingTicket.state)}`}>
                  {formatState(viewingTicket.state)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Cliente</span>
                <span className="font-medium text-gray-900">{viewingTicket.customerName}</span>
              </div>
              {viewingTicket.customerPhone && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Teléfono</span>
                  <span className="font-medium text-gray-900">{viewingTicket.customerPhone}</span>
                </div>
              )}
              {viewingTicket.customerEmail && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{viewingTicket.customerEmail}</span>
              </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Dispositivo</span>
                <span className="font-medium text-gray-900 text-right">
                  {viewingTicket.device} {viewingTicket.brand ? `(${viewingTicket.brand}` : ''}
                  {viewingTicket.model ? ` - ${viewingTicket.model})` : viewingTicket.brand ? ')' : ''}
                </span>
              </div>
              {viewingTicket.serialNumber && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-500">Número de Serie / IMEI</span>
                  <span className="font-medium text-gray-900">{viewingTicket.serialNumber}</span>
                </div>
              )}
              <div className="border-b pb-2">
                <span className="font-medium text-gray-500">Problema Reportado</span>
                <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{viewingTicket.problem}</p>
              </div>
              {viewingTicket.diagnosis && (
                <div className="border-b pb-2">
                  <span className="font-medium text-gray-500">Diagnóstico</span>
                  <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{viewingTicket.diagnosis}</p>
                </div>
              )}
              {viewingTicket.solution && (
                <div className="border-b pb-2">
                  <span className="font-medium text-gray-500">Solución</span>
                  <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{viewingTicket.solution}</p>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Costo Estimado</span>
                <span className="font-medium text-gray-900">
                  ${(viewingTicket.estimatedCost || 0).toLocaleString()}
                </span>
              </div>
              {viewingTicket.finalCost && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-500">Costo Final</span>
                  <span className="font-medium text-gray-900">
                    ${(viewingTicket.finalCost || 0).toLocaleString()}
                  </span>
                </div>
              )}
              {viewingTicket.advancePayment && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-500">Anticipo</span>
                  <span className="font-medium text-gray-900">
                    ${(viewingTicket.advancePayment || 0).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Tiempo Estimado</span>
                <span className="font-medium text-gray-900">{viewingTicket.estimatedTime || 0} días</span>
              </div>
              {viewingTicket.internalNotes && (
                <div className="border-b pb-2">
                  <span className="font-medium text-gray-500">Notas Internas</span>
                  <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">
                    {viewingTicket.internalNotes}
                  </p>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Fecha de Creación</span>
                <span className="font-medium text-gray-900">
                  {new Date(viewingTicket.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button 
                onClick={handleCloseViewModal}
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
