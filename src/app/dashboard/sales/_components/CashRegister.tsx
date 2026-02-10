'use client'

import { useEffect, useRef, useState } from 'react'
import { PaymentMethod, CreateSaleLine } from '../../../../lib/hooks/useSales'
import { InventoryItem } from '../../../../lib/hooks/useStock'
import { OrgMember } from '../../../../lib/hooks/useUsers'
import { Customer } from '../../../../lib/hooks/useCustomers'
import { Ticket } from '@celhm/types'
import { CashRegisterForm, SaleLineItem } from './types'
import {
  calculateCashRegisterSubtotal,
  calculateCashRegisterDiscount,
  calculateCashRegisterIVA,
  calculateCashRegisterTotal,
  calculateTotalPieces,
} from './utils'
import { CustomerSelector } from './CustomerSelector'
import { useToast } from '../../../../hooks/use-toast'
import { useCashRegisters } from '../../../../lib/hooks/useCash'
import { useAuthStore } from '../../../../stores/auth'

interface CashRegisterProps {
  isOpen: boolean
  form: CashRegisterForm
  stockItems: InventoryItem[]
  users: OrgMember[]
  customers: Customer[]
  tickets: Ticket[]
  onFormChange: (form: CashRegisterForm) => void
  onPay: () => void
  onCancel: () => void
  onCreateCustomer: (name: string, phone: string) => Promise<void>
}

export function CashRegister({
  isOpen,
  form,
  stockItems,
  users,
  customers,
  tickets,
  onFormChange,
  onPay,
  onCancel,
  onCreateCustomer,
}: CashRegisterProps) {
  const cashRegisterRef = useRef<HTMLDivElement>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketSearch, setTicketSearch] = useState('')
  const user = useAuthStore((state) => state.user)
  const { data: cashRegisters = [] } = useCashRegisters(user?.branchId || 0)

  // Hotkeys setup
  const handlePayRef = useRef(onPay)
  const handleCancelRef = useRef(onCancel)

  useEffect(() => {
    handlePayRef.current = onPay
    handleCancelRef.current = onCancel
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.altKey && e.key === 'F10') {
        e.preventDefault()
        handlePayRef.current()
      } else if (e.altKey && e.key === 'F11') {
        e.preventDefault()
        handleCancelRef.current()
      } else if (e.altKey && e.key === 'F9') {
        e.preventDefault()
        setShowDetailsModal(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleAddProduct = (item: InventoryItem) => {
    const existingLineIndex = form.lines.findIndex(
      line => line.variantId === item.variantId
    )

    if (existingLineIndex >= 0) {
      const newLines = [...form.lines]
      const line = newLines[existingLineIndex]
      const newQty = line.qty + 1
      newLines[existingLineIndex] = {
        ...line,
        qty: newQty,
        amount: newQty * line.unitPrice
      }
      onFormChange({ ...form, lines: newLines, productSearch: '' })
    } else {
      const price = Number(item.price) || 0
      const newLine: SaleLineItem = {
        variantId: item.variantId,
        code: item.sku,
        product: item.name,
        qty: 1,
        unitPrice: price,
        amount: price,
      }
      onFormChange({
        ...form,
        lines: [...form.lines, newLine],
        productSearch: '',
      })
    }
  }

  const handleUpdateLine = (index: number, field: keyof SaleLineItem, value: any) => {
    const newLines = [...form.lines]
    const line = { ...newLines[index] }
    const isRepairOrder = line.code.startsWith('TICKET-')

    // Si es una orden de reparación y se intenta cambiar la cantidad, no permitirlo
    if (field === 'qty' && isRepairOrder) {
      return // No permitir cambiar la cantidad de órdenes de reparación
    }

    if (field === 'qty') {
      const qty = Math.max(1, Number(value) || 1)
      const unitPrice = Number(line.unitPrice) || 0
      line.qty = qty
      line.amount = qty * unitPrice
    } else if (field === 'advance') {
      // El anticipo no se puede modificar, viene de la orden de reparación
      return
    } else {
      // Solo permitir modificar cantidad, no precio
      (line as any)[field] = value
    }

    newLines[index] = line
    onFormChange({ ...form, lines: newLines })
  }

  const handleRemoveLine = (index: number) => {
    onFormChange({
      ...form,
      lines: form.lines.filter((_, i) => i !== index),
    })
  }

  const { toast } = useToast()

  const handleAddTicket = (ticket: Ticket) => {
    // Verificar si el ticket ya está agregado
    const existingTicketIndex = form.lines.findIndex(
      line => line.code === `TICKET-${ticket.id}`
    )

    if (existingTicketIndex >= 0) {
      toast({
        variant: "destructive",
        title: "Orden duplicada",
        description: "Esta orden de reparación ya está agregada.",
      })
      return
    }

    // Usar finalCost si existe, sino estimatedCost, sino 0
    const ticketPrice = ticket.finalCost || ticket.estimatedCost || 0
    // Obtener el anticipo de la orden de reparación (si existe)
    const advancePayment = ticket.advancePayment || 0

    const newLine: SaleLineItem = {
      variantId: undefined,
      code: `TICKET-${ticket.id}`,
      product: `Orden de Reparación ${ticket.folio} - ${ticket.device} (${ticket.customerName})`,
      qty: 1,
      unitPrice: ticketPrice,
      advance: advancePayment,
      amount: ticketPrice,
    }

    onFormChange({
      ...form,
      lines: [...form.lines, newLine],
    })

    setShowTicketModal(false)
    setTicketSearch('')

    toast({
      variant: "default",
      title: "Orden agregada",
      description: "La orden se ha agregado a la venta.",
    })
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.folio.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    ticket.customerName.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    ticket.device.toLowerCase().includes(ticketSearch.toLowerCase())
  )

  const filteredStockItems = stockItems.filter(item =>
    item.sku.toLowerCase().includes(form.productSearch.toLowerCase()) ||
    item.name.toLowerCase().includes(form.productSearch.toLowerCase())
  )

  const subtotal = calculateCashRegisterSubtotal(form.lines)
  const discount = calculateCashRegisterDiscount(form)
  const iva = calculateCashRegisterIVA(form)
  const total = calculateCashRegisterTotal(form)
  const totalPieces = calculateTotalPieces(form.lines)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4" ref={cashRegisterRef}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col">
        {/* Header Bar */}
        <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold">TICKET</span>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
          <button className="text-white hover:text-gray-200 text-xl font-bold">
            +
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header Section */}
            <div className="bg-gray-100 px-6 py-4 border-b">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha: *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => onFormChange({ ...form, date: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                      readOnly
                    />
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente: *
                  </label>
                  <CustomerSelector
                    customers={customers}
                    value={form.customerId}
                    customerName={form.customerName}
                    onSelect={(customerId, customerName) => {
                      onFormChange({ ...form, customerId, customerName })
                    }}
                    onCreateCustomer={onCreateCustomer}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Solicitar factura:</label>
                  <input
                    type="checkbox"
                    checked={form.requestInvoice}
                    onChange={(e) => onFormChange({ ...form, requestInvoice: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caja:
                  </label>
                  <select
                    value={form.cashRegisterId || ''}
                    onChange={(e) => onFormChange({ ...form, cashRegisterId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md bg-white text-blue-800 font-medium"
                  >
                    <option value="">Seleccionar Caja...</option>
                    {cashRegisters.map((register) => (
                      <option key={register.id} value={register.id}>
                        {register.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendedor:
                  </label>
                  <select
                    value={form.sellerId}
                    onChange={(e) => onFormChange({ ...form, sellerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    {users.map((member) => (
                      <option key={member.id} value={member.user.id.toString()}>
                        {member.user.name || member.user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago: *
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => onFormChange({ ...form, paymentMethod: e.target.value as PaymentMethod })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="OTRO">Otro</option>
                    </select>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Table Header */}
            <div className="bg-blue-600 text-white px-6 py-2">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium">
                <div>Cant</div>
                <div>Código</div>
                <div>Producto</div>
                <div>Precio</div>
                <div>Anticipo</div>
                <div>Importe</div>
              </div>
            </div>

            {/* Products Table Body */}
            <div className="flex-1 overflow-y-auto bg-white">
              {form.lines.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay productos agregados
                </div>
              ) : (
                <div className="divide-y">
                  {form.lines.map((line, index) => {
                    const isRepairOrder = line.code.startsWith('TICKET-')
                    const advance = line.advance || 0
                    const finalAmount = line.amount - advance
                    return (
                      <div key={index} className="grid grid-cols-6 gap-4 px-6 py-3 hover:bg-gray-50">
                        <input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={(e) => {
                            if (isRepairOrder) return // No permitir cambios en órdenes de reparación
                            const qty = parseInt(e.target.value) || 1
                            handleUpdateLine(index, 'qty', qty)
                          }}
                          onBlur={(e) => {
                            if (isRepairOrder) return // No permitir cambios en órdenes de reparación
                            const qty = parseInt(e.target.value) || 1
                            if (qty < 1) {
                              handleUpdateLine(index, 'qty', 1)
                            }
                          }}
                          disabled={isRepairOrder}
                          readOnly={isRepairOrder}
                          className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${isRepairOrder ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                          title={isRepairOrder ? 'La cantidad de órdenes de reparación está fija en 1' : ''}
                        />
                        <div className="text-sm text-gray-700">{String(line.code || '')}</div>
                        <div className="text-sm text-gray-700">{String(line.product || '')}</div>
                        <div className="text-sm text-gray-700 font-medium">
                          ${(line.unitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div>
                          {isRepairOrder ? (
                            advance > 0 ? (
                              <div className="text-sm text-gray-700 font-medium">
                                ${advance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">${(finalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <button
                            onClick={() => handleRemoveLine(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-bold"
                            title="Eliminar producto"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Section */}
            <div className="bg-gray-50 border-t px-6 py-4">
              <div className="grid grid-cols-3 gap-6">
                {/* Left: Product Search */}
                <div className="space-y-2 relative">
                  <button
                    onClick={() => setShowTicketModal(true)}
                    className="w-full bg-purple-600 text-white py-2 px-3 rounded-md hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm mb-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">Agregar Orden de Reparación</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={form.productSearch}
                      onChange={(e) => onFormChange({ ...form, productSearch: e.target.value })}
                      placeholder="Buscar producto..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredStockItems.length > 0) {
                          handleAddProduct(filteredStockItems[0])
                        }
                      }}
                    />
                  </div>
                  {form.productSearch && filteredStockItems.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredStockItems.slice(0, 10).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleAddProduct(item)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                        >
                          <div className="font-medium">{String(item.name || '')}</div>
                          <div className="text-xs text-gray-500">SKU: {String(item.sku || '')} - ${(Number(item.price) || 0).toLocaleString()}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={form.productDetails}
                    onChange={(e) => onFormChange({ ...form, productDetails: e.target.value })}
                    placeholder="Detalles del producto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>

                {/* Middle: Discount and Add Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Descto:</label>
                    <input
                      type="number"
                      min="0"
                      step={form.discountPercent ? "0.01" : "1"}
                      max={form.discountPercent ? 100 : undefined}
                      value={form.discount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        const maxValue = form.discountPercent ? 100 : undefined
                        const finalValue = maxValue && value > maxValue ? maxValue : value
                        onFormChange({ ...form, discount: finalValue })
                      }}
                      placeholder={form.discountPercent ? "0-100" : "0"}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.discountPercent}
                        onChange={(e) => {
                          const isPercent = e.target.checked
                          // Si cambia a porcentaje y el valor es mayor a 100, resetear a 0
                          const newDiscount = isPercent && form.discount > 100 ? 0 : form.discount
                          onFormChange({ ...form, discountPercent: isPercent, discount: newDiscount })
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm">%</span>
                    </label>
                  </div>
                  {form.discountPercent && form.discount > 0 && (
                    <div className="text-xs text-gray-600">
                      Descuento: {form.discount}% = ${calculateCashRegisterDiscount(form).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                  {!form.discountPercent && form.discount > 0 && (
                    <div className="text-xs text-gray-600">
                      Descuento: ${form.discount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 flex flex-col items-center space-y-1 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-medium">AGREGAR DETALLES</span>
                    <span className="text-xs opacity-75">ALT+F9</span>
                  </button>
                  {form.ticketDetails && (
                    <div className="text-xs text-gray-600 mt-1 truncate" title={form.ticketDetails}>
                      {form.ticketDetails.length > 30 ? `${form.ticketDetails.substring(0, 30)}...` : form.ticketDetails}
                    </div>
                  )}
                </div>

                {/* Right: Totals */}
                <div className="space-y-2 text-right">
                  <div className="text-sm">
                    <span className="text-gray-700">Total Pzas.</span>
                    <span className="ml-2 font-medium">{totalPieces}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="ml-2 font-medium">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-700">IVA</span>
                    <span className="ml-2 font-medium">${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-lg font-bold pt-2 border-t border-gray-300">
                    <span className="text-gray-900">Total</span>
                    <span className="ml-2">${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Action Buttons */}
          <div className="w-40 bg-gray-50 border-l flex flex-col items-center justify-center space-y-6 p-6">
            <button
              onClick={onPay}
              className="w-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white py-5 px-6 rounded-xl hover:from-green-600 hover:via-green-700 hover:to-green-800 flex flex-col items-center space-y-2 shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-base">PAGAR</span>
              <span className="text-xs opacity-90 bg-white/20 px-2 py-0.5 rounded">ALT+F10</span>
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white py-5 px-6 rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-800 flex flex-col items-center space-y-2 shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="font-bold text-base">CANCELAR</span>
              <span className="text-xs opacity-90 bg-white/20 px-2 py-0.5 rounded">ALT+F11</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal para agregar detalles del ticket */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Agregar Detalles al Ticket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalles del ticket:
                </label>
                <textarea
                  value={form.ticketDetails}
                  onChange={(e) => onFormChange({ ...form, ticketDetails: e.target.value })}
                  placeholder="Escribe cualquier detalle adicional para este ticket..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={6}
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar orden de reparación */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Seleccionar Orden de Reparación</h2>
            <div className="mb-4">
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Buscar por folio, cliente o dispositivo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {ticketSearch ? 'No se encontraron órdenes de reparación' : 'No hay órdenes de reparación disponibles'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTickets.map((ticket) => {
                    const ticketPrice = ticket.finalCost || ticket.estimatedCost || 0
                    const isAlreadyAdded = form.lines.some(line => line.code === `TICKET-${ticket.id}`)

                    return (
                      <button
                        key={ticket.id}
                        onClick={() => !isAlreadyAdded && handleAddTicket(ticket)}
                        disabled={isAlreadyAdded}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isAlreadyAdded ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-bold text-blue-600">Folio: {ticket.folio}</span>
                              {isAlreadyAdded && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  Ya agregado
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-700">
                              <div><strong>Cliente:</strong> {ticket.customerName}</div>
                              <div><strong>Dispositivo:</strong> {ticket.device}</div>
                              {ticket.brand && <div><strong>Marca:</strong> {ticket.brand}</div>}
                              {ticket.model && <div><strong>Modelo:</strong> {ticket.model}</div>}
                              <div><strong>Estado:</strong> {ticket.state}</div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-green-600">
                              ${ticketPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {ticket.finalCost ? 'Costo Final' : 'Costo Estimado'}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
              <button
                onClick={() => {
                  setShowTicketModal(false)
                  setTicketSearch('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
