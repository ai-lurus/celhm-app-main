'use client'

import { Sale, SaleLine } from '../../../../lib/hooks/useSales'
import { PAYMENT_METHOD_LABELS } from './ReturnModal'

interface DevolucionReceiptProps {
  sale: Sale
  onClose: () => void
}

export function DevolucionReceipt({ sale, onClose }: DevolucionReceiptProps) {
  const refundMethod = sale.payments[0]?.method
  const refundMethodLabel = refundMethod
    ? PAYMENT_METHOD_LABELS[refundMethod] || refundMethod
    : '-'
  const cashierName = sale.user?.name || sale.user?.email || '-'
  const totalReturned = Math.abs(sale.total || 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto print:bg-white print:static print:block print:opacity-100">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl my-8 relative print:m-0 print:p-0 print:w-[80mm] print:shadow-none print:bg-white print:max-w-none print:rounded-none">

        {/* Visual Content - Hidden when printing */}
        <div className="print:hidden">
          <h2 className="text-xl font-bold mb-4 text-rose-600">Comprobante de Devolución</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Folio</label>
                <p className="text-sm text-foreground">{sale.folio}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Cajero</label>
                <p className="text-sm text-foreground">{cashierName}</p>
              </div>
            </div>
            {sale.customer && (
              <div>
                <label className="block text-sm font-medium text-foreground">Cliente</label>
                <p className="text-sm text-foreground">{sale.customer.name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Productos Devueltos
              </label>
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
                      <td className="px-4 py-2 text-sm">${Math.abs(line.unitPrice || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">${Math.abs(line.subtotal || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-rose-50 p-4 rounded">
              <div className="flex justify-between font-bold border-t border-border pt-2">
                <span>Total Devuelto:</span>
                <span className="text-rose-600">
                  -${totalReturned.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Método de reembolso:</span>
                <span>{refundMethodLabel}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Comprobante
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Printable Area - Formatted for 80mm thermal printers - Hidden on screen */}
        <div className="hidden print:block bg-white text-black p-0 w-[80mm] text-[12px] font-mono leading-tight mx-auto max-w-[80mm]">
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold mb-1 uppercase tracking-wide">CelHM</h1>
            <p className="font-bold text-sm border border-black py-1 my-2 uppercase">
              Comprobante de Devolución
            </p>
            <p className="mb-1 text-sm">Folio: {sale?.folio || 'N/A'}</p>
            <p className="mb-1">{sale?.createdAt ? new Date(sale.createdAt).toLocaleString('es-MX', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }) : 'Fecha no disponible'}</p>
            <p className="mb-1 truncate">
              Cliente: {sale?.customer?.name || 'CLIENTE DE MOSTRADOR'}
            </p>
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
            <div className="flex justify-between font-bold mb-1 text-xs">
              <span className="w-7/12">Cant x Desc</span>
              <span className="w-2/12 text-right">Precio</span>
              <span className="w-3/12 text-right">Total</span>
            </div>
            {sale?.lines?.map((line: SaleLine) => (
              <div key={line.id || Math.random()} className="flex justify-between items-start mb-1.5">
                <span className="w-7/12 break-words leading-tight">{line.qty}x {line.description}</span>
                <span className="w-2/12 text-right leading-tight">${Math.abs(line.unitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                <span className="w-3/12 text-right leading-tight">${Math.abs(line.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 text-xs">
            <div className="flex justify-between font-bold text-sm mt-1 border-t border-dashed border-gray-400 pt-2 pb-1">
              <span>TOTAL DEVUELTO:</span>
              <span>-${totalReturned.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Método de reembolso:</span>
              <span>{refundMethodLabel}</span>
            </div>
          </div>

          <div className="mb-4 text-xs border-t border-dashed border-gray-400 pt-2">
            <div className="flex justify-between">
              <span>Cajero:</span>
              <span>{cashierName}</span>
            </div>
          </div>

          <div className="text-center mt-6 text-[9px] space-y-1 border-t border-dashed border-gray-400 pt-2">
            <p>Este documento confirma la devolución de los productos listados.</p>
          </div>
        </div>
      </div>

      {/* Global styles for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            visibility: visible;
          }
          .print\\:block * {
            visibility: visible;
          }
          .fixed {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          @page {
            margin: 0;
            size: 80mm auto;
          }
        }
      `}} />
    </div>
  )
}
