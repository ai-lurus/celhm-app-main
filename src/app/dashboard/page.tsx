'use client'

import { useEffect } from 'react'
import { useTickets } from '../../lib/hooks/useTickets'
import { useStock } from '../../lib/hooks/useStock'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/auth'
import { Ticket } from '@celhm/types'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  // Get tickets for stats
  const { data: ticketsData, error: ticketsError } = useTickets({ page: 1, pageSize: 100 })
  const tickets = Array.isArray((ticketsData as any)?.data) ? (ticketsData as any).data : []

  // Get low stock alerts
  const { data: lowStockAlerts = [], error: stockAlertsError } = useQuery({
    queryKey: ['stock', 'alerts'],
    queryFn: async () => {
      const response = await api.get('/stock/alerts')
      return response.data
    },
    enabled: !!user,
    retry: false, // Don't retry on error to avoid showing error object
  })
  
  // Get all stock to calculate total value
  const { data: stockData, error: stockError } = useStock({ page: 1, pageSize: 1000 })
  const stockItems = Array.isArray((stockData as any)?.data) ? (stockData as any).data : []
  
  // Log errors but don't render them - prevent error objects from being thrown
  useEffect(() => {
    if (ticketsError) {
      console.error('Error loading tickets:', ticketsError)
    }
    if (stockError) {
      console.error('Error loading stock:', stockError)
    }
    if (stockAlertsError) {
      console.error('Error loading stock alerts:', stockAlertsError)
    }
  }, [ticketsError, stockError, stockAlertsError])

  const totalTickets = (ticketsData as any)?.pagination?.total || 0
  const activeTickets = tickets.filter((t: Ticket) =>
    !['ENTREGADO', 'CANCELADO'].includes(t.state)
  ).length
  const lowStockItems = lowStockAlerts.length
  const totalStockValue = stockItems.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0)

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
            {tickets.slice(0, 5).map((ticket: Ticket) => (
              <div key={ticket.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{ticket.folio}</p>
                  <p className="text-xs text-gray-500">{ticket.customerName}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${ticket.state === 'RECIBIDO' ? 'bg-blue-100 text-blue-800' :
                  ticket.state === 'EN_REPARACION' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.state === 'REPARADO' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {ticket.state}
                </span>
              </div>
            ))}
            {tickets.length === 0 && (
              <p className="text-sm text-gray-500">No hay tickets recientes</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alertas de Stock</h3>
          <div className="space-y-4">
            {lowStockAlerts.slice(0, 5).map((alert: any) => (
              <div key={alert.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {alert.variant?.name || alert.variant?.product?.name || 'Producto desconocido'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {alert.qty} / Mín: {alert.min} - {alert.branch?.name || ''}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                  {alert.qty <= 0 ? 'Crítico' : 'Bajo'}
                </span>
              </div>
            ))}
            {lowStockAlerts.length === 0 && (
              <p className="text-sm text-gray-500">No hay alertas de stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

