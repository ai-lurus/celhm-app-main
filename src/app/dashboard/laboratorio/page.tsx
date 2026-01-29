'use client'

import { useState } from 'react'
import { useTickets, useCreateTicket, useUpdateTicket, useUpdateTicketState, useTicket } from '../../../lib/hooks/useTickets'
import { useToast } from '../../../hooks/use-toast'
import { useBranches } from '../../../lib/hooks/useBranches'
import { useAuthStore } from '../../../stores/auth'
import { usePermissions } from '../../../lib/hooks/usePermissions'
import { Ticket, TicketState } from '@celhm/types'
import { DateRangePicker } from '../../../components/ui/DateRangePicker'
import dynamic from 'next/dynamic'
import { TicketReceiptDocument } from '../../../components/tickets/TicketReceipt'

const PDFDownloadLink = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink), {
  ssr: false,
  loading: () => null
})

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
  estimatedCost: number | string
  finalCost: number | string
  estimatedTime: number
  advancePayment: number | string
  internalNotes: string
  condition: string
  accessories: string
  risk: string
  warrantyDays: number
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
  estimatedCost: '0.00',
  finalCost: '0.00',
  estimatedTime: 1,
  advancePayment: '0.00',
  internalNotes: '',
  condition: 'BUENO',
  accessories: 'N/A',
  risk: 'NINGUNO',
  warrantyDays: 30,
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
  const { can } = usePermissions()
  const user = useAuthStore((state) => state.user)
  const { data: branches = [] } = useBranches({ enabled: can('canViewAllBranches') })
  const [selectedState, setSelectedState] = useState<TicketState | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activeView, setActiveView] = useState<'kanban' | 'table'>('kanban')

  // New filters state
  const [branchId, setBranchId] = useState<number | ''>(user?.branchId || (branches.length > 0 ? branches[0].id : 1))
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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
  const { toast } = useToast()
  const { data: ticketsData, isLoading } = useTickets({
    state: activeView === 'table' ? (selectedState || undefined) : undefined,
    search: searchTerm || undefined,
    branchId: branchId === '' ? undefined : branchId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    sortOrder,
    page: activeView === 'table' ? page : 1,
    pageSize: activeView === 'table' ? pageSize : 1000,
    kanban: activeView === 'kanban',
  })

  const { data: viewingTicket } = useTicket(viewingTicketId || 0)

  const createTicket = useCreateTicket()
  const updateTicket = useUpdateTicket()
  const updateTicketState = useUpdateTicketState()

  const tickets = Array.isArray((ticketsData as any)?.data) ? (ticketsData as any).data : []
  const pagination = (ticketsData as any)?.pagination as {
    page: number
    pageSize: number
    total: number
    totalPages: number
  } | undefined

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
      estimatedCost: ticket.estimatedCost ? Number(ticket.estimatedCost).toFixed(2) : '0.00',
      finalCost: ticket.finalCost ? Number(ticket.finalCost).toFixed(2) : '0.00',
      estimatedTime: ticket.estimatedTime || 1,
      advancePayment: ticket.advancePayment ? Number(ticket.advancePayment).toFixed(2) : '0.00',
      internalNotes: ticket.internalNotes || '',
      condition: ticket.condition || 'BUENO',
      accessories: ticket.accessories || 'N/A',
      risk: ticket.risk || 'NINGUNO',
      warrantyDays: ticket.warrantyDays || 30,
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

  const handlePriceChange = (
    field: keyof TicketForm,
    value: string
  ) => {
    // Permitir solo números y un punto decimal
    if (!/^\d*\.?\d*$/.test(value)) return

    // Si el valor actual es '0.00' y el usuario ingresa un número, reemplazar
    // Si el valor es solo '.', convertir a '0.'
    let newValue = value

    if (formData[field] === '0.00' && value.length === 5 && value.endsWith('.')) {
      // Caso borde: usuario escribe punto sobre 0.00 seleccionado o similar, pero más seguro manejar el cambio directo
    }

    // Lógica principal: si el valor anterior era 0.00 y entra un dígito, 
    // asumimos que el usuario quiere empezar a escribir un nuevo número
    if (formData[field] === '0.00' && value !== '0.00') {
      const lastChar = value.slice(-1)
      if (value.length > 4 && /^\d$/.test(lastChar)) {
        // Si longitud aumentó y es 0.00 + digito -> reemplazar por digito
        // Pero value vendrá como "0.005", hay que detectar eso.
        // Mejor approach: analizar la entrada más cruda si fuera posible, pero aquí tenemos el valor resultante.
        // Si el valor resultante empieza con 0.00 y sigue algo, quitar el 0.00
        if (value.startsWith('0.00')) {
          newValue = value.substring(4)
        }
      }
    }

    // Mejor lógica más simple recomendada:
    // Si el usuario escribe, el input nativo da el nuevo valor.
    // Si teníamos '0.00' y ahora tenemos '0.005', el usuario escribió 5. Queremos que sea '5'.
    if (formData[field] === '0.00' && value.length > 4) {
      newValue = value.replace('0.00', '')
    }

    // Evitar múltiples ceros a la izquierda excepto si es 0.
    if (newValue.length > 1 && newValue.startsWith('0') && newValue[1] !== '.') {
      newValue = newValue.replace(/^0+/, '')
    }

    if (newValue === '') newValue = '' // Permitir vacío mientras escribe

    setFormData({ ...formData, [field]: newValue })
  }

  const handlePriceBlur = (field: keyof TicketForm) => {
    const value = formData[field]
    if (typeof value === 'string' && value !== '') {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        setFormData({ ...formData, [field]: num.toFixed(2) })
      } else {
        // Reset to 0.00 if invalid? Or keep as is? User said "fix the value", implies valid number usually.
        // If it's something like ".", fallback to 0.00
        setFormData({ ...formData, [field]: '0.00' })
      }
    } else if (value === '' || value === undefined) {
      // If empty, set to 0.00
      setFormData({ ...formData, [field]: '0.00' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customerName || !formData.device || !formData.problem) {
      toast({
        variant: "destructive",
        title: "Campos faltantes",
        description: "Por favor, completa Nombre del Cliente, Dispositivo y Problema.",
      })
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
            estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost.toString()) : undefined,
            finalCost: formData.finalCost ? parseFloat(formData.finalCost.toString()) : undefined,
            estimatedTime: formData.estimatedTime || undefined,
            internalNotes: formData.internalNotes || undefined,
            condition: formData.condition || undefined,
            accessories: formData.accessories || undefined,
            risk: formData.risk || undefined,
            warrantyDays: formData.warrantyDays || undefined,
          },
        })
        toast({
          variant: "success",
          title: "Nota actualizada",
          description: "La nota se ha actualizado correctamente.",
        })
      } else {
        await createTicket.mutateAsync({
          branchId: typeof branchId === 'number' ? branchId : (user?.branchId || branches[0]?.id || 1),
          customerName: formData.customerName,
          customerPhone: formData.customerPhone || undefined,
          customerEmail: formData.customerEmail || undefined,
          device: formData.device,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          serialNumber: formData.serialNumber || undefined,
          problem: formData.problem,
          diagnosis: formData.diagnosis || undefined,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost.toString()) : undefined,
          estimatedTime: formData.estimatedTime || undefined,
          advancePayment: formData.advancePayment ? parseFloat(formData.advancePayment.toString()) : undefined,
          internalNotes: formData.internalNotes || undefined,
          condition: formData.condition || undefined,
          accessories: formData.accessories || undefined,
          risk: formData.risk || undefined,
          warrantyDays: formData.warrantyDays || undefined,
        })
        toast({
          variant: "success",
          title: "Nota creada",
          description: "La nota se ha creado correctamente.",
        })
      }
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving ticket:', error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error?.message || 'Error al guardar el ticket',
      })
    }
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statusTicket) return

    // Validación RF-ORD-08: No entregar si no está pagado
    if (statusForm.state === 'ENTREGADO') {
      const totalPaid = Number(statusTicket.advancePayment) || 0
      const finalCost = Number(statusForm.finalCost || statusTicket.finalCost || statusTicket.estimatedCost) || 0

      if (totalPaid < finalCost) {
        toast({
          variant: "destructive",
          title: "Pago pendiente",
          description: `No se puede marcar como ENTREGADO. El ticket tiene un costo de $${finalCost.toLocaleString()} pero solo se ha pagado $${totalPaid.toLocaleString()}. Falta pagar $${(finalCost - totalPaid).toLocaleString()}.`,
        })
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
      toast({
        variant: "success",
        title: "Estado actualizado",
        description: "El estado del ticket se ha actualizado correctamente.",
      })
      handleCloseStatusModal()
    } catch (error: any) {
      console.error('Error updating ticket status:', error)
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error?.message || 'Error al actualizar el estado del ticket',
      })
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
          <h1 className="text-2xl font-bold text-foreground">Laboratorio</h1>
          <p className="text-muted-foreground">Gestión de notas de laboratorio</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Nueva Nota
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-card p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Folio, cliente, dispositivo..."
              className="w-full border border-border rounded-md px-3 py-2"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Estado</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value as TicketState | '')
                setPage(1)
              }}
              disabled={activeView === 'kanban'}
              className={`w-full border border-border rounded-md px-3 py-2 ${activeView === 'kanban' ? 'bg-muted text-muted-foreground' : ''}`}
            >
              <option value="">Todos los estados</option>
              {allStates.map((state: TicketState) => (
                <option key={state} value={state}>
                  {formatState(state)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sucursal</label>
            <select
              value={branchId}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseInt(e.target.value)
                setBranchId(value)
                setPage(1)
              }}
              disabled={!can('canViewAllBranches')}
              className={`w-full border border-border rounded-md px-3 py-2 ${!can('canViewAllBranches') ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
            >
              {branches.length > 1 && can('canViewAllBranches') && <option value="">Todas</option>}
              {can('canViewAllBranches') ? (
                branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))
              ) : (
                <option value={user?.branchId || 1}>
                  {/* Si no cargamos ramas, mostrar ID o nombre genérico, o confiar en que branches está vacío */}
                  {/* Mejor: si no tiene permiso, branches estará vacio. Mostramos "Mi Sucursal" o el ID */}
                  Sucursal {user?.branchId || 1}
                </option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Orden</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'asc' | 'desc')
                setPage(1)
              }}
              className="w-full border border-border rounded-md px-3 py-2"
            >
              <option value="desc">Más recientes primero</option>
              <option value="asc">Más antiguos primero</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Periodo</label>
            <DateRangePicker
              from={startDate}
              to={endDate}
              onRangeChange={(from, to) => {
                setStartDate(from)
                setEndDate(to)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="w-full space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveView('kanban')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeView === 'kanban'
                ? 'border-blue-500 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
            >
              Vista Kanban
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeView === 'table'
                ? 'border-blue-500 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
            >
              Lista
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
            Cargando notas...
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
            No hay notas registradas
          </div>
        ) : activeView === 'kanban' ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {(['RECIBIDO', 'DIAGNOSTICO', 'ESPERANDO_PIEZA', 'EN_REPARACION', 'REPARADO'] as TicketState[]).map((state: TicketState) => {
              const stateTickets = tickets.filter((ticket: Ticket) => ticket.state === state)
              return (
                <div key={state} className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-foreground">{formatState(state as TicketState)}</h3>
                    <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                      {stateTickets.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stateTickets.map((ticket: Ticket) => (
                      <div key={ticket.id} className="bg-card p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-medium text-foreground">{ticket.folio}</div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(ticket.state)}`}>
                            {formatState(ticket.state)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{ticket.customerName}</p>
                            <p className="text-xs text-muted-foreground">{ticket.customerPhone || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground">
                              {ticket.device} {ticket.brand ? `- ${ticket.brand}` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{ticket.problem}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Est: ${(ticket.estimatedCost || 0).toLocaleString()}</span>
                            <span>{ticket.estimatedTime || 0} días</span>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => handleOpenView(ticket)}
                            title="Ver Detalle"
                            className="flex-1 flex justify-center p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors"
                          >
                            <IconView className="w-5 h-5" />
                          </button>
                          {can('canUpdateTickets') && (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {stateTickets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No hay tickets en este estado
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Folio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dispositivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Problema</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Costo Est.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {tickets.map((ticket: Ticket) => (
                    <tr key={ticket.id} className="hover:bg-muted">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {ticket.folio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">{ticket.customerName}</div>
                          <div className="text-sm text-muted-foreground">{ticket.customerPhone || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">{ticket.device}</div>
                          <div className="text-sm text-muted-foreground">
                            {ticket.brand || ''} {ticket.model ? `- ${ticket.model}` : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground max-w-xs truncate">{ticket.problem}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(ticket.state)}`}>
                          {formatState(ticket.state)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        ${(ticket.estimatedCost || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleOpenView(ticket)}
                            title="Ver"
                            className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors"
                          >
                            <IconView className="w-5 h-5" />
                          </button>

                          {can('canUpdateTickets') && (
                            <>
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-4 rounded-lg shadow-sm border border-border gap-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">
                    {Math.min(pagination.total, (pagination.page - 1) * pagination.pageSize + 1)}
                  </span>
                  -
                  <span className="font-medium text-foreground">
                    {Math.min(pagination.total, pagination.page * pagination.pageSize)}
                  </span> de <span className="font-medium text-foreground">{pagination.total}</span> resultados
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-muted-foreground">Filas por página:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
                      className="border border-border rounded-md px-2 py-1 text-sm bg-background"
                    >
                      {[10, 20, 50, 100].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                      Anterior
                    </button>
                    <div className="px-3 py-1 text-sm font-medium">
                      Página {page} de {pagination.totalPages}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
        }
      </div >

      {/* Modal Crear/Editar Ticket */}
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-card p-8 rounded-lg shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                {editingTicket ? 'Editar Nota' : 'Crear Nueva Nota'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Nombre del Cliente *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Correo electrónico</label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Dispositivo *</label>
                      <input
                        type="text"
                        required
                        value={formData.device}
                        onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="Ej: iPhone 12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Marca</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="Ej: Apple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Modelo</label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="Ej: A2403"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Número de Serie / IMEI</label>
                      <input
                        type="text"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Estado / Condición</label>
                      <input
                        type="text"
                        value={formData.condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="Ej: Bueno, Pantalla estrellada..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Accesorios</label>
                      <input
                        type="text"
                        value={formData.accessories}
                        onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="Ej: Funda, SIM, Cargador..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Observaciones / Riesgo</label>
                      <textarea
                        rows={2}
                        value={formData.risk}
                        onChange={(e) => setFormData({ ...formData, risk: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="Riesgos aceptados por el cliente..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Garantía (Días)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.warrantyDays}
                        onChange={(e) => setFormData({ ...formData, warrantyDays: parseInt(e.target.value) || 0 })}
                        className="w-full border border-border rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Problema Reportado *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.problem}
                        onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="Ej: Pantalla rota, no enciende..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Diagnóstico</label>
                      <textarea
                        rows={3}
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="Diagnóstico técnico..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Costo Estimado ($)</label>
                      <input
                        type="text"
                        value={formData.estimatedCost}
                        onChange={(e) => handlePriceChange('estimatedCost', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => handlePriceBlur('estimatedCost')}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="0.00"
                      />
                    </div>
                    {editingTicket && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Costo Final ($)</label>
                        <input
                          type="text"
                          value={formData.finalCost}
                          onChange={(e) => handlePriceChange('finalCost', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => handlePriceBlur('finalCost')}
                          className="w-full border border-border rounded-md px-3 py-2"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Tiempo Estimado (días)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.estimatedTime}
                        onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 1 })}
                        className="w-full border border-border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Anticipo ($)</label>
                      <input
                        type="text"
                        value={formData.advancePayment}
                        onChange={(e) => handlePriceChange('advancePayment', e.target.value)}
                        onBlur={() => handlePriceBlur('advancePayment')}
                        className="w-full border border-border rounded-md px-3 py-2"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Notas Internas</label>
                      <textarea
                        rows={3}
                        value={formData.internalNotes}
                        onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                        className="w-full border border-border rounded-md px-3 py-2"
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
        )
      }

      {/* Modal Cambiar Estado */}
      {
        isStatusModalOpen && statusTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
              <h2 className="text-xl font-bold text-foreground">Cambiar Estado del Ticket</h2>
              <div className="mt-4">
                <p className="font-medium">{statusTicket.folio}</p>
                <p className="text-sm text-muted-foreground">{statusTicket.customerName}</p>
              </div>
              <form onSubmit={handleUpdateStatus} className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nuevo Estado</label>
                  <select
                    value={statusForm.state}
                    onChange={(e) => setStatusForm({ ...statusForm, state: e.target.value as TicketState })}
                    className="w-full border border-border rounded-md px-3 py-2"
                  >
                    {allStates.map((state: TicketState) => (
                      <option key={state} value={state}>
                        {formatState(state)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Diagnóstico</label>
                  <textarea
                    rows={3}
                    value={statusForm.diagnosis}
                    onChange={(e) => setStatusForm({ ...statusForm, diagnosis: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Solución</label>
                  <textarea
                    rows={3}
                    value={statusForm.solution}
                    onChange={(e) => setStatusForm({ ...statusForm, solution: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Costo Estimado ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={statusForm.estimatedCost}
                    onChange={(e) => setStatusForm({ ...statusForm, estimatedCost: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Costo Final ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={statusForm.finalCost}
                    onChange={(e) => setStatusForm({ ...statusForm, finalCost: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Notas</label>
                  <textarea
                    rows={2}
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2"
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
        )
      }

      {/* Modal Ver Detalles */}
      {
        isViewModalOpen && viewingTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Detalles del Ticket</h2>

              <div className="space-y-3 pt-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Folio</span>
                  <span className="font-medium text-foreground">{viewingTicket.folio}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Estado</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(viewingTicket.state)}`}>
                    {formatState(viewingTicket.state)}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Cliente</span>
                  <span className="font-medium text-foreground">{viewingTicket.customerName}</span>
                </div>
                {viewingTicket.customerPhone && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium text-muted-foreground">Teléfono</span>
                    <span className="font-medium text-foreground">{viewingTicket.customerPhone}</span>
                  </div>
                )}
                {viewingTicket.customerEmail && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground">{viewingTicket.customerEmail}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Dispositivo</span>
                  <span className="font-medium text-foreground text-right">
                    {viewingTicket.device} {viewingTicket.brand ? `(${viewingTicket.brand}` : ''}
                    {viewingTicket.model ? ` - ${viewingTicket.model})` : viewingTicket.brand ? ')' : ''}
                  </span>
                </div>
                {viewingTicket.serialNumber && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium text-muted-foreground">Número de Serie / IMEI</span>
                    <span className="font-medium text-foreground">{viewingTicket.serialNumber}</span>
                  </div>
                )}
                <div className="border-b pb-2">
                  <span className="font-medium text-muted-foreground">Problema Reportado</span>
                  <p className="font-medium text-foreground mt-1 whitespace-pre-wrap">{viewingTicket.problem}</p>
                </div>
                {viewingTicket.diagnosis && (
                  <div className="border-b pb-2">
                    <span className="font-medium text-muted-foreground">Diagnóstico</span>
                    <p className="font-medium text-foreground mt-1 whitespace-pre-wrap">{viewingTicket.diagnosis}</p>
                  </div>
                )}
                {viewingTicket.solution && (
                  <div className="border-b pb-2">
                    <span className="font-medium text-muted-foreground">Solución</span>
                    <p className="font-medium text-foreground mt-1 whitespace-pre-wrap">{viewingTicket.solution}</p>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Costo Estimado</span>
                  <span className="font-medium text-foreground">
                    ${(viewingTicket.estimatedCost || 0).toLocaleString()}
                  </span>
                </div>
                {viewingTicket.finalCost && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium text-muted-foreground">Costo Final</span>
                    <span className="font-medium text-foreground">
                      ${(viewingTicket.finalCost || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Anticipo</span>
                  <span className="font-medium text-foreground">
                    ${(viewingTicket.advancePayment || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Tiempo Estimado</span>
                  <span className="font-medium text-foreground">{viewingTicket.estimatedTime || 0} días</span>
                </div>
                {viewingTicket.internalNotes && (
                  <div className="border-b pb-2">
                    <span className="font-medium text-muted-foreground">Notas Internas</span>
                    <p className="font-medium text-foreground mt-1 whitespace-pre-wrap">
                      {viewingTicket.internalNotes}
                    </p>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Fecha de Creación</span>
                  <span className="font-medium text-foreground">
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
                <PDFDownloadLink
                  document={<TicketReceiptDocument ticket={viewingTicket} />}
                  fileName={`RECIBO-${viewingTicket.folio}.pdf`}
                >
                  {({ loading }) => (
                    <button
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center disabled:opacity-50"
                    >
                      {loading ? 'Generando...' : 'Descargar Recibo'}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

