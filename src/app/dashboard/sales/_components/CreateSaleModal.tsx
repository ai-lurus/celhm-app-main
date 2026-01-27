'use client'

import { CreateSaleLine, PaymentMethod } from '../../../../lib/hooks/useSales'
import { Customer } from '../../../../lib/hooks/useCustomers'
import { Ticket } from '@celhm/types'
import { Product } from '../../../../lib/hooks/useCatalog'

interface CreateSaleModalProps {
  isOpen: boolean
  form: {
    customerId: string
    ticketId: string
    lines: CreateSaleLine[]
    discount: number
  }
  customers: Customer[]
  tickets: Ticket[]
  products: Product[]
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onFormChange: (form: { customerId: string; ticketId: string; lines: CreateSaleLine[]; discount: number }) => void
  onAddLine: () => void
  onRemoveLine: (index: number) => void
  onUpdateLine: (index: number, field: keyof CreateSaleLine, value: any) => void
  calculateSubtotal: () => number
  calculateTotal: () => number
  isPending: boolean
}

export function CreateSaleModal({
  isOpen,
  form,
  customers,
  tickets,
  products,
  onClose,
  onSubmit,
  onFormChange,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
  calculateSubtotal,
  calculateTotal,
  isPending,
}: CreateSaleModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card rounded-lg p-6 w-full max-w-3xl my-8">
        <h2 className="text-xl font-bold mb-4">Nueva Venta</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Cliente</label>
              <select
                value={form.customerId}
                onChange={(e) => onFormChange({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                <option value="">Seleccionar cliente...</option>
                {customers.map((c: Customer) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Orden de Reparación</label>
              <select
                value={form.ticketId}
                onChange={(e) => onFormChange({ ...form, ticketId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                <option value="">Ninguna</option>
                {tickets.map((t: Ticket) => (
                  <option key={t.id} value={t.id}>
                    {t.folio} - {t.customerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-foreground">Líneas de Venta</label>
              <button
                type="button"
                onClick={onAddLine}
                className="text-sm text-primary hover:text-blue-800"
              >
                + Agregar Línea
              </button>
            </div>
            <div className="space-y-2">
              {form.lines.map((line: CreateSaleLine, index: number) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Producto</label>
                    <select
                      value={line.variantId || ''}
                      onChange={(e) => onUpdateLine(index, 'variantId', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-2 py-1 border border-border rounded text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {products.map((p: Product) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Descripción</label>
                    <input
                      type="text"
                      required
                      value={line.description}
                      onChange={(e) => onUpdateLine(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Cantidad</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={line.qty}
                      onChange={(e) => onUpdateLine(index, 'qty', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Precio Unit.</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => onUpdateLine(index, 'unitPrice', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-border rounded text-sm"
                    />
                  </div>
                  <div className="flex items-end space-x-1">
                    <button
                      type="button"
                      onClick={() => onRemoveLine(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descuento Total</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={(e) => onFormChange({ ...form, discount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>

          <div className="bg-muted p-4 rounded">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${(calculateSubtotal() || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Descuento:</span>
              <span>-${((form.discount || 0)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold mt-2 pt-2 border-t">
              <span>Total:</span>
              <span>${(calculateTotal() || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Crear Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
