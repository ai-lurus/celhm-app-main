'use client'

import { useState } from 'react'
import { Sale, PaymentMethod } from '../../../../lib/hooks/useSales'

interface PaymentModalProps {
  sale: Sale
  onClose: () => void
  onSubmit: (data: { amount: number; method: PaymentMethod; reference: string }) => Promise<void>
  isPending: boolean
}

export function PaymentModal({ sale, onClose, onSubmit, isPending }: PaymentModalProps) {
  const [form, setForm] = useState({
    amount: sale.total - sale.paidAmount,
    method: 'CASH' as PaymentMethod,
    reference: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Agregar Pago</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Venta: {sale.folio} - Total: ${((sale.total || 0)).toLocaleString()} - 
          Pendiente: ${((sale.total || 0) - (sale.paidAmount || 0)).toLocaleString()}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Monto</label>
            <input
              type="number"
              required
              min="0.01"
              max={sale.total - sale.paidAmount}
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Método de Pago</label>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}
              className="w-full px-3 py-2 border border-border rounded-md"
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Referencia (opcional)</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Agregar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
