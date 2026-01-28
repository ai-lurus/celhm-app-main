'use client'

import { Sale, SaleLine, Payment } from '../../../../lib/hooks/useSales'

interface ViewSaleModalProps {
  sale: Sale
  onClose: () => void
  getStatusColor: (status: string) => string
}

export function ViewSaleModal({ sale, onClose, getStatusColor }: ViewSaleModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-xl font-bold mb-4">Detalles de Venta</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Folio</label>
              <p className="text-sm text-foreground">{sale.folio}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Estado</label>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(sale.status)}`}>
                {sale.status}
              </span>
            </div>
          </div>
          {sale.customer && (
            <div>
              <label className="block text-sm font-medium text-foreground">Cliente</label>
              <p className="text-sm text-foreground">{sale.customer.name}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Líneas de Venta</label>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Descripción</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Cantidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Precio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {sale.lines.map((line: SaleLine) => (
                  <tr key={line.id}>
                    <td className="px-4 py-2 text-sm">{line.description}</td>
                    <td className="px-4 py-2 text-sm">{line.qty}</td>
                    <td className="px-4 py-2 text-sm">${((line.unitPrice || 0)).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">${((line.subtotal || 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-muted p-4 rounded">
            <div className="flex justify-between">
              <span className="font-bold">Total:</span>
              <span className="font-bold">${((sale.total || 0)).toLocaleString()}</span>
            </div>
          </div>
          {sale.payments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Pagos</label>
              <div className="space-y-2">
                {sale.payments.map((payment: Payment) => (
                  <div key={payment.id} className="flex justify-between text-sm">
                    <span>{payment.method} - {payment.reference || 'Sin referencia'}</span>
                    <span>${((payment.amount || 0)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
