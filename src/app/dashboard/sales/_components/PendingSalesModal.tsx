'use client'

import { useState } from 'react'
import { Sale } from '../../../../lib/hooks/useSales'

interface PendingSalesModalProps {
  sales: Sale[]
  onContinue: (sale: Sale) => void
  onCancel: (sale: Sale) => void
  onClose: () => void
}

const formatMoney = (value: number) =>
  `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })

export function PendingSalesModal({ sales, onContinue, onCancel, onClose }: PendingSalesModalProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set())

  const visibleSales = sales.filter((sale) => !dismissedIds.has(sale.id))

  const handleIgnore = (saleId: number) => {
    setDismissedIds((prev) => new Set(prev).add(saleId))
  }

  const handleCancel = (sale: Sale) => {
    onCancel(sale)
    setDismissedIds((prev) => new Set(prev).add(sale.id))
  }

  if (visibleSales.length === 0) return null

  return (
    <div
      data-testid="pending-sales-modal"
      className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4"
    >
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-lg font-bold">Documentos pendientes de este cliente</h2>
          <button onClick={onClose} title="Cerrar" className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Este cliente tiene ventas sin cerrar. Puedes continuarlas, cancelarlas o ignorarlas — la venta nueva
            se puede guardar de todas formas.
          </p>
          {visibleSales.map((sale) => {
            const balance = sale.total - sale.paidAmount
            const hasPayment = sale.paidAmount > 0
            return (
              <div
                key={sale.id}
                className="border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-medium">{sale.folio}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</div>
                  <div className="text-sm mt-1 space-x-3">
                    <span>
                      Total: <span>{formatMoney(sale.total)}</span>
                    </span>
                    <span>
                      Abonado: <span>{formatMoney(sale.paidAmount)}</span>
                    </span>
                    <span className="font-medium">
                      Saldo: <span>{formatMoney(balance)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onContinue(sale)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={() => handleCancel(sale)}
                    disabled={hasPayment}
                    title={hasPayment ? 'No se puede cancelar: ya tiene un abono registrado' : ''}
                    className="px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleIgnore(sale.id)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
