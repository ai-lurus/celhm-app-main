import { SaleLineItem, CashRegisterForm } from './types'
import { PaymentMethod } from '../../../../lib/hooks/useSales'

export const calculateCashRegisterSubtotal = (form: CashRegisterForm, vatRate: number = 0.16): number => {
  const total = calculateCashRegisterTotal(form)
  const rate = vatRate > 1 ? vatRate / 100 : vatRate
  return total / (1 + rate)
}

export const calculateCashRegisterDiscount = (form: CashRegisterForm): number => {
  // Sum of lines before global discount
  const sumLines = form.lines.reduce((sum, line) => {
    const amount = Number(line.amount) || 0
    const advance = Number(line.advance) || 0
    return sum + (amount - advance)
  }, 0)

  const discountValue = Number(form.discount) || 0
  if (form.discountPercent && discountValue > 0) {
    return (sumLines * discountValue) / 100
  }
  return discountValue
}

export const calculateCashRegisterIVA = (form: CashRegisterForm, vatRate: number = 0.16): number => {
  const total = calculateCashRegisterTotal(form)
  const subtotal = calculateCashRegisterSubtotal(form, vatRate)
  return total - subtotal
}

export const calculateCashRegisterTotal = (form: CashRegisterForm): number => {
  const sumLines = form.lines.reduce((sum, line) => {
    const amount = Number(line.amount) || 0
    const advance = Number(line.advance) || 0
    return sum + (amount - advance)
  }, 0)
  
  const discount = calculateCashRegisterDiscount(form)
  const total = sumLines - discount
  return Math.max(0, total) // Asegurar que no sea negativo
}

export const calculateTotalPieces = (lines: SaleLineItem[]): number => {
  return lines.reduce((sum, line) => {
    const qty = Number(line.qty) || 0
    return sum + qty
  }, 0)
}

type PaymentEntry = { method: PaymentMethod; amount: number }

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  'EFECTIVO',
  'TARJETA_DEBITO',
  'TARJETA_CREDITO',
  'TRANSFERENCIA',
  'CHEQUE',
  'OTRO',
]

export const getNextAvailablePaymentMethod = (payments: PaymentEntry[]): PaymentMethod => {
  const usedMethods = new Set(payments.map((p) => p.method))
  const available = PAYMENT_METHOD_OPTIONS.find((method) => !usedMethods.has(method))
  return available ?? 'OTRO'
}

export const rebalanceLastPayment = (payments: PaymentEntry[], total: number): PaymentEntry[] => {
  if (payments.length <= 1) return payments

  const lastIndex = payments.length - 1
  const sumOfOthers = payments
    .slice(0, lastIndex)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const lastAmount = parseFloat(Math.max(0, total - sumOfOthers).toFixed(2))

  return payments.map((p, i) => (i === lastIndex ? { ...p, amount: lastAmount } : p))
}
