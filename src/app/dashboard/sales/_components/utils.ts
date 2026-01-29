import { SaleLineItem, CashRegisterForm } from './types'

export const calculateCashRegisterSubtotal = (lines: SaleLineItem[]): number => {
  return lines.reduce((sum, line) => {
    const amount = Number(line.amount) || 0
    const advance = Number(line.advance) || 0
    return sum + (amount - advance) // Restar el anticipo del monto total
  }, 0)
}

export const calculateCashRegisterDiscount = (form: CashRegisterForm): number => {
  const subtotal = calculateCashRegisterSubtotal(form.lines)
  const discountValue = Number(form.discount) || 0
  if (form.discountPercent && discountValue > 0) {
    return (subtotal * discountValue) / 100
  }
  return discountValue
}

export const calculateCashRegisterIVA = (form: CashRegisterForm): number => {
  const subtotal = calculateCashRegisterSubtotal(form.lines)
  const discount = calculateCashRegisterDiscount(form)
  const baseAmount = subtotal - discount
  return baseAmount > 0 ? baseAmount * 0.16 : 0 // 16% IVA
}

export const calculateCashRegisterTotal = (form: CashRegisterForm): number => {
  const subtotal = calculateCashRegisterSubtotal(form.lines)
  const discount = calculateCashRegisterDiscount(form)
  const iva = calculateCashRegisterIVA(form)
  const total = subtotal - discount + iva
  return Math.max(0, total) // Asegurar que no sea negativo
}

export const calculateTotalPieces = (lines: SaleLineItem[]): number => {
  return lines.reduce((sum, line) => {
    const qty = Number(line.qty) || 0
    return sum + qty
  }, 0)
}
