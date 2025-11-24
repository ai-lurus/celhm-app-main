'use client'

import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get user from localStorage for demo
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Mock data for dashboard
  const mockTickets = [
    { id: 1, folio: 'LAB-SUC01-202412-0001', customerName: 'Ana Rodríguez', state: 'RECIBIDO' },
    { id: 2, folio: 'LAB-SUC01-202412-0002', customerName: 'Roberto Silva', state: 'DIAGNOSTICO' },
    { id: 3, folio: 'LAB-SUC01-202412-0003', customerName: 'Laura Martínez', state: 'ESPERANDO_PIEZA' },
    { id: 4, folio: 'LAB-SUC01-202412-0004', customerName: 'Miguel Torres', state: 'EN_REPARACION' },
  ]

  const mockStock = [
    { id: 1, name: 'Pantalla LCD iPhone 12 Negro', qty: 3, min: 5 },
    { id: 2, name: 'Batería Samsung Galaxy S21', qty: 2, min: 5 },
  ]

  const totalTickets = mockTickets.length
  const activeTickets = mockTickets.filter(t => 
    !['ENTREGADO', 'CANCELADO'].includes(t.state)
  ).length
  const lowStockItems = mockStock.filter(s => s.qty <= s.min).length
  const totalStockValue = 50000

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Bienvenido, {user?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
          <div className="text-2xl font-bold">{totalTickets}</div>
          <p className="text-xs text-gray-500">Todos los tickets registrados</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Tickets Activos</h3>
          <div className="text-2xl font-bold">{activeTickets}</div>
          <p className="text-xs text-gray-500">En proceso o pendientes</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Stock Bajo</h3>
          <div className="text-2xl font-bold text-red-600">{lowStockItems}</div>
          <p className="text-xs text-gray-500">Productos bajo mínimo</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Valor Inventario</h3>
          <div className="text-2xl font-bold">${totalStockValue.toLocaleString()}</div>
          <p className="text-xs text-gray-500">Valor total del stock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets Recientes</h3>
          <div className="space-y-4">
            {mockTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{ticket.folio}</p>
                  <p className="text-xs text-gray-500">{ticket.customerName}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  ticket.state === 'RECIBIDO' ? 'bg-blue-100 text-blue-800' :
                  ticket.state === 'EN_REPARACION' ? 'bg-yellow-100 text-yellow-800' :
                  ticket.state === 'REPARADO' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.state}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alertas de Stock</h3>
          <div className="space-y-4">
            {mockStock.filter(s => s.qty <= s.min).map((stock) => (
              <div key={stock.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{stock.name}</p>
                  <p className="text-xs text-gray-500">
                    Stock: {stock.qty} / Mín: {stock.min}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                  Crítico
                </span>
              </div>
            ))}
            {mockStock.filter(s => s.qty <= s.min).length === 0 && (
              <p className="text-sm text-gray-500">No hay alertas de stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

