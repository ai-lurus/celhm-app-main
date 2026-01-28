'use client'

import { Sale } from '../../../../lib/hooks/useSales'
import { IconView } from './IconView'

interface SalesTableProps {
  sales: Sale[]
  isLoading: boolean
  onViewSale: (sale: Sale) => void
  onAddPayment: (sale: Sale) => void
  getStatusColor: (status: string) => string
}

export function SalesTable({ sales, isLoading, onViewSale, onAddPayment, getStatusColor }: SalesTableProps) {
  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Folio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliente</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Pagado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">Cargando...</td>
            </tr>
          ) : sales.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">No hay ventas registradas</td>
            </tr>
          ) : (
            sales.map((sale: Sale) => (
              <tr key={sale.id} className="hover:bg-muted">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{sale.folio}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {sale.customer?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  ${((sale.total || 0)).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  ${((sale.paidAmount || 0)).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(sale.status)}`}>
                    {sale.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(sale.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onViewSale(sale)}
                      className="text-primary hover:text-blue-900"
                      title="Ver detalles"
                    >
                      <IconView />
                    </button>
                    {sale.status === 'PENDING' && sale.paidAmount < sale.total && (
                      <button
                        onClick={() => onAddPayment(sale)}
                        className="text-green-600 hover:text-green-900 text-sm"
                      >
                        Agregar Pago
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
  )
}
