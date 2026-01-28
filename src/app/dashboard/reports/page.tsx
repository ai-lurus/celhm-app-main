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
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Consulta reportes operativos y financieros</p>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sales'
              ? 'border-blue-500 text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            Ventas
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tickets'
              ? 'border-blue-500 text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            Órdenes
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'inventory'
              ? 'border-blue-500 text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            Inventario
          </button>
        </nav>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={salesParams.startDate}
                  onChange={(e) => setSalesParams({ ...salesParams, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={salesParams.endDate}
                  onChange={(e) => setSalesParams({ ...salesParams, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="w-full space-y-4">
            {salesLoading ? (
              <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">Cargando...</div>
            ) : salesReport && typeof salesReport.totalSales === 'number' ? (
              <div className="space-y-4">
                <div className="bg-card p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Resumen de Ventas</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary/10 p-4 rounded">
                      <div className="text-sm text-muted-foreground">Total Ventas</div>
                      <div className="text-2xl font-bold text-primary">
                        ${(salesReport.totalSales || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {salesReport.totalByPaymentMethod && Array.isArray(salesReport.totalByPaymentMethod) && salesReport.totalByPaymentMethod.length > 0 && (
                  <div className="bg-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Ventas por Método de Pago</h3>
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Método</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cantidad</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
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
                  <div className="bg-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Ventas por Tipo de Servicio</h3>
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cantidad</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
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
              <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
                No hay datos para el período seleccionado
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
          <div className="w-full md:w-1/4">
            <div className="bg-card p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-4">Filtros</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={ticketsParams.startDate}
                    onChange={(e) => setTicketsParams({ ...ticketsParams, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={ticketsParams.endDate}
                    onChange={(e) => setTicketsParams({ ...ticketsParams, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Estado</label>
                  <select
                    value={ticketsParams.state || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setTicketsParams({ ...ticketsParams, state: value ? (value as TicketState) : undefined })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md"
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
          </div>

          <div className="w-full md:w-3/4 space-y-4">
            {ticketsLoading ? (
              <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">Cargando...</div>
            ) : ticketsReport && typeof ticketsReport.totalTickets === 'number' ? (
              <div className="space-y-4">
                <div className="bg-card p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Resumen de Órdenes</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary/10 p-4 rounded">
                      <div className="text-sm text-muted-foreground">Total Órdenes</div>
                      <div className="text-2xl font-bold text-primary">{ticketsReport.totalTickets}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <div className="text-sm text-muted-foreground">Órdenes Cerradas</div>
                      <div className="text-2xl font-bold text-green-600">
                        {ticketsReport.closedTickets?.count || 0}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded">
                      <div className="text-sm text-muted-foreground">Ingresos por Órdenes</div>
                      <div className="text-2xl font-bold text-purple-600">
                        ${(ticketsReport.closedTickets?.totalRevenue || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {ticketsReport.ticketsByState && Array.isArray(ticketsReport.ticketsByState) && ticketsReport.ticketsByState.length > 0 && (
                  <div className="bg-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Órdenes por Estado</h3>
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
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
              <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
                No hay datos para el período seleccionado
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {inventoryLoading ? (
            <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">Cargando...</div>
          ) : inventoryReport && typeof inventoryReport.totalValue === 'number' ? (
            <div className="space-y-4">
              <div className="bg-card p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Resumen de Inventario</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 p-4 rounded">
                    <div className="text-sm text-muted-foreground">Valor Total</div>
                    <div className="text-2xl font-bold text-primary">
                      ${(inventoryReport.totalValue || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-muted-foreground">Total de Artículos</div>
                    <div className="text-2xl font-bold text-green-600">{inventoryReport.totalItems}</div>
                  </div>
                </div>
              </div>

              {inventoryReport.lowStockItems && Array.isArray(inventoryReport.lowStockItems) && inventoryReport.lowStockItems.length > 0 ? (
                <div className="bg-card p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Productos Bajo Existencias Mínimas</h3>
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Sucursal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Existencias</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Mínimo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {inventoryReport.lowStockItems.map((item: InventoryReport['lowStockItems'][0]) => (
                        <tr key={item.id} className={item.qty <= 0 ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {item.variant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {item.variant.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {item.branch.name}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${item.qty <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {item.qty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {item.min}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
                  No hay productos bajo existencias mínimas
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </div>
      )}
    </div>
  )
}

