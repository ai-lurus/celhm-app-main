'use client'

import { useState, useEffect } from 'react'

// --- Iconos ---
const IconEdit = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
const IconView = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconMovement = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

// --- Tipos de typescript ---
interface Ticket {
  id: number;
  folio: string;
  customerName: string;
  customerPhone: string;
  device: string;
  brand: string;
  model: string;
  problem: string;
  state: string;
  estimatedCost: number;
  estimatedTime: number;
  createdAt: string;
}

interface NewTicketForm {
  customerName: string;
  customerPhone: string;
  device: string;
  brand: string;
  model: string;
  problem: string;
  estimatedCost: number;
  estimatedTime: number;
}

// --- Datos iniciales ---
const initialTickets: Ticket[] = [
  { id: 1, folio: 'LAB-SUC01-202412-0001', customerName: 'Ana Rodríguez', customerPhone: '+52 555 987 6543', device: 'iPhone 12', brand: 'Apple', model: 'iPhone 12', problem: 'Pantalla rota, no enciende', state: 'RECIBIDO', estimatedCost: 2500, estimatedTime: 2, createdAt: '2024-12-01T10:00:00Z', },
  { id: 2, folio: 'LAB-SUC01-202412-0002', customerName: 'Roberto Silva', customerPhone: '+52 555 111 2222', device: 'Samsung Galaxy S21', brand: 'Samsung', model: 'Galaxy S21', problem: 'Batería no carga', state: 'DIAGNOSTICO', estimatedCost: 800, estimatedTime: 1, createdAt: '2024-12-01T11:00:00Z', },
  { id: 3, folio: 'LAB-SUC01-202412-0003', customerName: 'Laura Martínez', customerPhone: '+52 555 333 4444', device: 'iPhone 13', brand: 'Apple', model: 'iPhone 13', problem: 'Cargador no funciona', state: 'ESPERANDO_PIEZA', estimatedCost: 300, estimatedTime: 1, createdAt: '2024-12-01T12:00:00Z', },
  { id: 4, folio: 'LAB-SUC01-202412-0004', customerName: 'Miguel Torres', customerPhone: '+52 555 555 6666', device: 'iPhone 12', brand: 'Apple', model: 'iPhone 12', problem: 'Cambio de pantalla', state: 'EN_REPARACION', estimatedCost: 2500, estimatedTime: 2, createdAt: '2024-12-01T13:00:00Z', },
];

const newTicketInitialState: NewTicketForm = {
  customerName: '',
  customerPhone: '',
  device: '',
  brand: '',
  model: '',
  problem: '',
  estimatedCost: 0,
  estimatedTime: 1,
}

const allStates = [
  "RECIBIDO", "DIAGNOSTICO", "ESPERANDO_PIEZA", "EN_REPARACION", "REPARADO", "ENTREGADO", "CANCELADO"
];

export default function TicketsPage() {
  const [user, setUser] = useState<any>(null)
  
  // --- Estados para los filtros ---
  const [selectedState, setSelectedState] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('');

  // --- Estado para la lista de tickets (para poder agregar/editar) ---
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  // --- Estados para el modal "Nuevo/Editar Ticket" ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTicketData, setNewTicketData] = useState<NewTicketForm>(newTicketInitialState);
  const [itemToEdit, setItemToEdit] = useState<Ticket | null>(null);

  // --- Estados para el modal "cambiar estado" (Movimiento) ---
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [itemToChangeStatus, setItemToChangeStatus] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  
  // --- Estados para el modal "Ver Detalles" ---
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [itemToView, setItemToView] = useState<Ticket | null>(null);

  // --- Estado para la vista activa ---
  const [activeView, setActiveView] = useState<'kanban' | 'table'>('kanban');


  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // --- Logica para el Modal "Nuevo/Editar Ticket" ---
  const openEditModal = (ticket: Ticket) => {
    setItemToEdit(ticket); 
    setNewTicketData({
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      device: ticket.device,
      brand: ticket.brand,
      model: ticket.model,
      problem: ticket.problem,
      estimatedCost: ticket.estimatedCost,
      estimatedTime: ticket.estimatedTime,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItemToEdit(null); 
    setNewTicketData(newTicketInitialState);
  };
  
  const handleSaveTicket = () => {
    if (!newTicketData.customerName || !newTicketData.device || !newTicketData.problem) {
      alert('Por favor, completa Nombre, Dispositivo y Problema.');
      return;
    }

    if (itemToEdit) {
      // --- LOGICA DE ACTUALIZACION (EDITAR) ---
      setTickets(prevTickets => prevTickets.map(ticket => {
        if (ticket.id === itemToEdit.id) {
          return {
            ...ticket, 
            ...newTicketData 
          };
        }
        return ticket;
      }));
      
    } else {
      // --- LOGICA DE CREACION ---
      const newTicket: Ticket = {
        id: Math.max(0, ...tickets.map(t => t.id)) + 1,
        folio: `LAB-SUC01-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(tickets.length + 1).toString().padStart(4, '0')}`,
        ...newTicketData,
        state: 'RECIBIDO', 
        createdAt: new Date().toISOString(),
      };
      setTickets([...tickets, newTicket]);
    }

    closeModal();
  };

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTicketData({
      ...newTicketData,
      [name]: name === 'estimatedCost' || name === 'estimatedTime' ? parseFloat(value) || 0 : value,
    });
  };

  // --- Logica para el Modal "cambiar estado" (Movimiento) ---
  const openStatusModal = (ticket: Ticket) => {
    setItemToChangeStatus(ticket);
    setNewStatus(ticket.state); 
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setItemToChangeStatus(null);
    setNewStatus('');
  };

  const handleSaveStatus = () => {
    if (itemToChangeStatus) {
      setTickets(prevTickets => prevTickets.map(ticket => {
        if (ticket.id === itemToChangeStatus.id) {
          return { ...ticket, state: newStatus }; 
        }
        return ticket;
      }));
    }
    closeStatusModal();
  };
  
  // --- Logica para el Modal "Ver Detalles" ---
  const openViewModal = (ticket: Ticket) => {
    setItemToView(ticket);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setItemToView(null);
  };

  // --- Logica de Colores ---
  const getStateColor = (state: string) => {
    switch (state) {
      case 'RECIBIDO': return 'bg-blue-100 text-blue-800'
      case 'DIAGNOSTICO': return 'bg-purple-100 text-purple-800'
      case 'ESPERANDO_PIEZA': return 'bg-orange-100 text-orange-800'
      case 'EN_REPARACION': return 'bg-yellow-100 text-yellow-800'
      case 'REPARADO': return 'bg-green-100 text-green-800'
      case 'ENTREGADO': return 'bg-gray-100 text-gray-800'
      case 'CANCELADO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Logica de filtrado
  const filteredTickets = tickets.filter(ticket => {
    const stateMatch = selectedState === '' || ticket.state === selectedState;
    const searchMatch =
      ticket.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.device.toLowerCase().includes(searchTerm.toLowerCase());
    return stateMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* --- Encabezado --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600">Gestión de tickets de reparación</p>
        </div>
        <button 
          onClick={() => {
            setItemToEdit(null);
            setNewTicketData(newTicketInitialState);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Nuevo Ticket
        </button>
      </div>

      {/* --- Nuevo layout de 2 columnas --- */}
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">

        {/* --- Columna izquierda: sidebar de Filtros --- */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Filtros</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Folio, cliente, dispositivo..."
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos los estados</option>
                {allStates.map(state => (
                  <option key={state} value={state}>{state.charAt(0) + state.slice(1).toLowerCase().replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- Columna derecha: contenido principal--- */}
        <div className="w-full md:w-3/4 space-y-6">
          
          {/* --- Pestañas / Tabulador --- */}
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
                Vista Tickets
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'table'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lista Tickets
              </button>
            </nav>
          </div>
          
          {/* --- Vista kann (condicional dos vistas) --- */}
          {activeView === 'kanban' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {['RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION', 'REPARADO'].map((state) => {
                const stateTickets = filteredTickets.filter(ticket => ticket.state === state)
                return (
                  <div key={state} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">{state}</h3>
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
                              {ticket.state}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{ticket.customerName}</p>
                              <p className="text-xs text-gray-500">{ticket.customerPhone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">{ticket.device} - {ticket.brand}</p>
                              <p className="text-xs text-gray-500 truncate">{ticket.problem}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Est: ${ticket.estimatedCost?.toLocaleString()}</span>
                              <span>{ticket.estimatedTime} días</span>
                            </div>
                          </div>
                          <div className="mt-3 flex space-x-2">
                            <button 
                              onClick={() => openViewModal(ticket)}
                              title="Ver Detalle"
                              className="flex-1 flex justify-center p-1 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                            >
                              <IconView className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => openEditModal(ticket)}
                              title="Editar"
                              className="flex-1 flex justify-center p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"
                            >
                              <IconEdit className="w-5 h-5" />
                            </button>
                             <button 
                              onClick={() => openStatusModal(ticket)}
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
          )}

          {/* --- Vista de tabla (condicional dos vistas) --- */}
          {activeView === 'table' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Lista de Tickets</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Vista detallada de todos los tickets</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispositivo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problema</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Est.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.folio}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ticket.customerName}</div>
                            <div className="text-sm text-gray-500">{ticket.customerPhone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ticket.device}</div>
                            <div className="text-sm text-gray-500">{ticket.brand} - {ticket.model}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{ticket.problem}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(ticket.state)}`}>
                            {ticket.state}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ticket.estimatedCost?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => openViewModal(ticket)}
                                title="Ver"
                                className="p-1 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                              >
                                <IconView className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => openEditModal(ticket)}
                                title="Editar"
                                className="p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"
                              >
                                <IconEdit className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => openStatusModal(ticket)}
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
            </div>
          )}
        </div>
      </div>

      {/* --- Modal "nuevo/editar ticket" --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {itemToEdit ? 'Editar Ticket' : 'Crear Nuevo Ticket'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Cliente</label>
                  <input type="text" name="customerName" value={newTicketData.customerName} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input type="text" name="customerPhone" value={newTicketData.customerPhone} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dispositivo</label>
                  <input type="text" name="device" value={newTicketData.device} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ej: iPhone 12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marca</label>
                  <input type="text" name="brand" value={newTicketData.brand} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ej: Apple" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Modelo</label>
                  <input type="text" name="model" value={newTicketData.model} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ej: A2403" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Problema Reportado</label>
                  <textarea name="problem" value={newTicketData.problem} onChange={handleModalInputChange} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ej: Pantalla rota, no enciende..."></textarea>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Costo Estimado ($)</label>
                  <input type="number" name="estimatedCost" value={newTicketData.estimatedCost} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiempo Estimado (días)</label>
                  <input type="number" name="estimatedTime" value={newTicketData.estimatedTime} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button onClick={closeModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleSaveTicket} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                {itemToEdit ? 'Actualizar Ticket' : 'Guardar Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Modal "cambiar estado" --- */}
      {isStatusModalOpen && itemToChangeStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900">Cambiar Estado del Ticket</h2>
            <div className="mt-4">
              <p className="font-medium">{itemToChangeStatus.folio}</p>
              <p className="text-sm text-gray-500">{itemToChangeStatus.customerName}</p>
            </div>
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nuevo Estado</label>
                <select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)} 
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                >
                  {allStates.map(state => (
                    <option key={state} value={state}>{state.charAt(0) + state.slice(1).toLowerCase().replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button 
                onClick={closeStatusModal} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">
                Cancelar
              </button>
              <button 
                onClick={handleSaveStatus} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Modal "Ver Detalles" --- */}
      {isViewModalOpen && itemToView && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Detalles del Ticket</h2>
            
            <div className="space-y-3 pt-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Folio</span>
                <span className="font-medium text-gray-900">{itemToView.folio}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Estado</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(itemToView.state)}`}>
                  {itemToView.state}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Cliente</span>
                <span className="font-medium text-gray-900">{itemToView.customerName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Teléfono</span>
                <span className="font-medium text-gray-900">{itemToView.customerPhone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Dispositivo</span>
                <span className="font-medium text-gray-900 text-right">{itemToView.device} ({itemToView.brand} - {itemToView.model})</span>
              </div>
              <div className="border-b pb-2">
                <span className="font-medium text-gray-500">Problema Reportado</span>
                <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{itemToView.problem}</p>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Costo Estimado</span>
                <span className="font-medium text-gray-900">${itemToView.estimatedCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Tiempo Estimado</span>
                <span className="font-medium text-gray-900">{itemToView.estimatedTime} días</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Fecha de Creación</span>
                <span className="font-medium text-gray-900">{new Date(itemToView.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button 
                onClick={closeViewModal} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
