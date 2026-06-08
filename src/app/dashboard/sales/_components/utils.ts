import { SaleLineItem, CashRegisterForm } from './types'

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
