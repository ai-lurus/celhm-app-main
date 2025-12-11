'use client'

import { useState } from 'react'
import { useSales, useCreateSale, useAddPayment, Sale, CreateSaleLine, PaymentMethod, SaleLine, Payment } from '../../../lib/hooks/useSales'
import { useCustomers, Customer } from '../../../lib/hooks/useCustomers'
import { useTickets } from '../../../lib/hooks/useTickets'
import { Ticket } from '@celhm/types'
import { useProducts, Product } from '../../../lib/hooks/useCatalog'
import { useBranches } from '../../../lib/hooks/useBranches'
import { useAuthStore } from '../../../stores/auth'

const IconView = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function SalesPage() {
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [viewingSale, setViewingSale] = useState<Sale | null>(null)

  const { data: branches = [] } = useBranches()
  const branchId = user?.branchId || (branches.length > 0 ? branches[0].id : 1)

  const { data: salesData, isLoading } = useSales({ branchId, page, pageSize: 20 })
  const { data: customersData } = useCustomers({ page: 1, pageSize: 100 })
  const { data: ticketsData } = useTickets({ page: 1, pageSize: 100 })
  const { data: productsData } = useProducts({ page: 1, pageSize: 100 })

  const createSale = useCreateSale()
  const addPayment = useAddPayment()

  const sales = Array.isArray((salesData as any)?.data) ? (salesData as any).data : []
  const customers = Array.isArray((customersData as any)?.data) ? (customersData as any).data : []
  const tickets = Array.isArray((ticketsData as any)?.data) ? (ticketsData as any).data : []
  const products = Array.isArray((productsData as any)?.data) ? (productsData as any).data : []

  // Form state
  const [saleForm, setSaleForm] = useState({
    customerId: '',
    ticketId: '',
    lines: [] as CreateSaleLine[],
    discount: 0,
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'CASH' as PaymentMethod,
    reference: '',
  })

  const handleAddLine = () => {
    setSaleForm({
      ...saleForm,
      lines: [...saleForm.lines, { description: '', qty: 1, unitPrice: 0 }],
    })
  }

  const handleRemoveLine = (index: number) => {
    setSaleForm({
      ...saleForm,
      lines: saleForm.lines.filter((_, i) => i !== index),
    })
  }

  const handleUpdateLine = (index: number, field: keyof CreateSaleLine, value: any) => {
    const newLines = [...saleForm.lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setSaleForm({ ...saleForm, lines: newLines })
  }

  const calculateSubtotal = () => {
    return saleForm.lines.reduce((sum, line) => sum + (line.unitPrice * line.qty) - (line.discount || 0), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - saleForm.discount
  }

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saleForm.lines.length === 0) {
      alert('Agrega al menos una línea de venta')
      return
    }

    try {
      await createSale.mutateAsync({
        branchId,
        customerId: saleForm.customerId ? parseInt(saleForm.customerId) : undefined,
        ticketId: saleForm.ticketId ? parseInt(saleForm.ticketId) : undefined,
        lines: saleForm.lines,
        discount: saleForm.discount,
      })
      setIsCreateModalOpen(false)
      setSaleForm({ customerId: '', ticketId: '', lines: [], discount: 0 })
    } catch (error) {
      console.error('Error creating sale:', error)
    }
  }

  const handleAddPaymentToSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSale) return

    try {
      await addPayment.mutateAsync({
        saleId: selectedSale.id,
        data: paymentForm,
      })
      setIsPaymentModalOpen(false)
      setSelectedSale(null)
      setPaymentForm({ amount: 0, method: 'CASH', reference: '' })
    } catch (error) {
      console.error('Error adding payment:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas y pagos</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Nueva Venta
        </button>
      </div>

      {/* Tabla de Ventas */}
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
                    ${sale.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    ${sale.paidAmount.toLocaleString()}
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
                        onClick={() => setViewingSale(sale)}
                        className="text-primary hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <IconView />
                      </button>
                      {sale.status === 'PENDING' && sale.paidAmount < sale.total && (
                        <button
                          onClick={() => {
                            setSelectedSale(sale)
                            setPaymentForm({ amount: sale.total - sale.paidAmount, method: 'CASH', reference: '' })
                            setIsPaymentModalOpen(true)
                          }}
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

      {/* Modal Crear Venta */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-card rounded-lg p-6 w-full max-w-3xl my-8">
            <h2 className="text-xl font-bold mb-4">Nueva Venta</h2>
            <form onSubmit={handleCreateSale} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cliente</label>
                  <select
                    value={saleForm.customerId}
                    onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}
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
                    value={saleForm.ticketId}
                    onChange={(e) => setSaleForm({ ...saleForm, ticketId: e.target.value })}
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
                    onClick={handleAddLine}
                    className="text-sm text-primary hover:text-blue-800"
                  >
                    + Agregar Línea
                  </button>
                </div>
                <div className="space-y-2">
                  {saleForm.lines.map((line: CreateSaleLine, index: number) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Producto</label>
                        <select
                          value={line.variantId || ''}
                          onChange={(e) => handleUpdateLine(index, 'variantId', e.target.value ? parseInt(e.target.value) : undefined)}
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
                          onChange={(e) => handleUpdateLine(index, 'description', e.target.value)}
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
                          onChange={(e) => handleUpdateLine(index, 'qty', parseInt(e.target.value))}
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
                          onChange={(e) => handleUpdateLine(index, 'unitPrice', parseFloat(e.target.value))}
                          className="w-full px-2 py-1 border border-border rounded text-sm"
                        />
                      </div>
                      <div className="flex items-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
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
                  value={saleForm.discount}
                  onChange={(e) => setSaleForm({ ...saleForm, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>

              <div className="bg-muted p-4 rounded">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Descuento:</span>
                  <span>-${saleForm.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>${calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSale.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createSale.isPending ? 'Guardando...' : 'Crear Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Pago */}
      {isPaymentModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar Pago</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Venta: {selectedSale.folio} - Total: ${selectedSale.total.toLocaleString()} - 
              Pendiente: ${(selectedSale.total - selectedSale.paidAmount).toLocaleString()}
            </p>
            <form onSubmit={handleAddPaymentToSale} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Monto</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  max={selectedSale.total - selectedSale.paidAmount}
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Método de Pago</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
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
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false)
                    setSelectedSale(null)
                  }}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addPayment.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {addPayment.isPending ? 'Guardando...' : 'Agregar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">Detalles de Venta</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Folio</label>
                  <p className="text-sm text-foreground">{viewingSale.folio}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Estado</label>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(viewingSale.status)}`}>
                    {viewingSale.status}
                  </span>
                </div>
              </div>
              {viewingSale.customer && (
                <div>
                  <label className="block text-sm font-medium text-foreground">Cliente</label>
                  <p className="text-sm text-foreground">{viewingSale.customer.name}</p>
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
                    {viewingSale.lines.map((line: SaleLine) => (
                      <tr key={line.id}>
                        <td className="px-4 py-2 text-sm">{line.description}</td>
                        <td className="px-4 py-2 text-sm">{line.qty}</td>
                        <td className="px-4 py-2 text-sm">${line.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm">${line.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-muted p-4 rounded">
                <div className="flex justify-between">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">${viewingSale.total.toLocaleString()}</span>
                </div>
              </div>
              {viewingSale.payments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Pagos</label>
                  <div className="space-y-2">
                    {viewingSale.payments.map((payment: Payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span>{payment.method} - {payment.reference || 'Sin referencia'}</span>
                        <span>${payment.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingSale(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


