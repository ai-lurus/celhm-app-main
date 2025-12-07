'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSalesReport, useTicketsReport, useInventoryReport, InventoryReport } from '../../../lib/hooks/useReports'
import { useBranches } from '../../../lib/hooks/useBranches'
import { useAuthStore } from '../../../stores/auth'
import { usePermissions } from '../../../lib/hooks/usePermissions'
import { TicketState } from '@celhm/types'

export default function ReportsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { can } = usePermissions()

  useEffect(() => {
    if (!can('canViewFinancialReports')) {
      router.push('/dashboard')
    }
  }, [can, router])

  if (!can('canViewFinancialReports')) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Acceso Denegado</h2>
          <p className="text-red-600">No tienes permisos para ver reportes financieros.</p>
        </div>
      </div>
    )
  }
  const [activeTab, setActiveTab] = useState<'sales' | 'tickets' | 'inventory'>('sales')
  
  const { data: branches = [] } = useBranches()
  const branchId = user?.branchId || (branches.length > 0 ? branches[0].id : undefined)

  // Fechas por defecto: hoy
  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const [salesParams, setSalesParams] = useState({
    branchId: branchId || undefined,
    startDate: startOfDay.toISOString().split('T')[0],
    endDate: endOfDay.toISOString().split('T')[0],
  })

  const [ticketsParams, setTicketsParams] = useState({
    branchId: branchId || undefined,
    startDate: startOfDay.toISOString().split('T')[0],
    endDate: endOfDay.toISOString().split('T')[0],
    state: undefined as TicketState | undefined,
  })

  const [inventoryParams, setInventoryParams] = useState({
    branchId: branchId || undefined,
  })

  const { data: salesReport, isLoading: salesLoading } = useSalesReport(salesParams)
  const { data: ticketsReport, isLoading: ticketsLoading } = useTicketsReport(ticketsParams)
  const { data: inventoryReport, isLoading: inventoryLoading } = useInventoryReport(inventoryParams)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Consulta reportes operativos y financieros</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sales'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ventas
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Órdenes
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inventario
          </button>
        </nav>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Filtros</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={salesParams.startDate}
                  onChange={(e) => setSalesParams({ ...salesParams, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={salesParams.endDate}
                  onChange={(e) => setSalesParams({ ...salesParams, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {salesLoading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">Cargando...</div>
          ) : salesReport && typeof salesReport.totalSales === 'number' ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Resumen de Ventas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Total Ventas</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${(salesReport.totalSales || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {salesReport.totalByPaymentMethod && Array.isArray(salesReport.totalByPaymentMethod) && salesReport.totalByPaymentMethod.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Ventas por Método de Pago</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesReport.totalByPaymentMethod.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item?.method || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item?.count || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ${((item?.amount ?? 0)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {salesReport.totalByServiceType && Array.isArray(salesReport.totalByServiceType) && salesReport.totalByServiceType.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Ventas por Tipo de Servicio</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesReport.totalByServiceType.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item?.type || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item?.count || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ${((item?.amount ?? 0)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No hay datos para el período seleccionado
            </div>
          )}
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Filtros</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={ticketsParams.startDate}
                  onChange={(e) => setTicketsParams({ ...ticketsParams, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={ticketsParams.endDate}
                  onChange={(e) => setTicketsParams({ ...ticketsParams, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={ticketsParams.state || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setTicketsParams({ ...ticketsParams, state: value ? (value as TicketState) : undefined })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todos</option>
                  <option value="RECIBIDO">Recibido</option>
                  <option value="DIAGNOSTICO">Diagnóstico</option>
                  <option value="ESPERANDO_PIEZA">Esperando Pieza</option>
                  <option value="EN_REPARACION">En Reparación</option>
                  <option value="REPARADO">Reparado</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {ticketsLoading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">Cargando...</div>
          ) : ticketsReport && typeof ticketsReport.totalTickets === 'number' ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Resumen de Órdenes</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Total Órdenes</div>
                    <div className="text-2xl font-bold text-blue-600">{ticketsReport.totalTickets}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Órdenes Cerradas</div>
                    <div className="text-2xl font-bold text-green-600">
                      {ticketsReport.closedTickets?.count || 0}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Ingresos por Órdenes</div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${(ticketsReport.closedTickets?.totalRevenue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {ticketsReport.ticketsByState && Array.isArray(ticketsReport.ticketsByState) && ticketsReport.ticketsByState.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Órdenes por Estado</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ticketsReport.ticketsByState.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.state}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No hay datos para el período seleccionado
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {inventoryLoading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">Cargando...</div>
          ) : inventoryReport && typeof inventoryReport.totalValue === 'number' ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Resumen de Inventario</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Valor Total</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${(inventoryReport.totalValue || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Total de Items</div>
                    <div className="text-2xl font-bold text-green-600">{inventoryReport.totalItems}</div>
                  </div>
                </div>
              </div>

              {inventoryReport.lowStockItems && Array.isArray(inventoryReport.lowStockItems) && inventoryReport.lowStockItems.length > 0 ? (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Productos Bajo Stock Mínimo</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryReport.lowStockItems.map((item: InventoryReport['lowStockItems'][0]) => (
                        <tr key={item.id} className={item.qty <= 0 ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {item.variant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.variant.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.branch.name}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${item.qty <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {item.qty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.min}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                  No hay productos bajo stock mínimo
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>
      )}
    </div>
  )
}
