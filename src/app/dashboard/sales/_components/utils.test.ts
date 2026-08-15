import { getNextAvailablePaymentMethod, rebalanceLastPayment, PAYMENT_METHOD_OPTIONS } from './utils'
import { PaymentMethod } from '../../../../lib/hooks/useSales'

describe('PAYMENT_METHOD_OPTIONS', () => {
  it('lists all 6 payment methods in the fixed UI order', () => {
    expect(PAYMENT_METHOD_OPTIONS).toEqual([
      'EFECTIVO',
      'TARJETA_DEBITO',
      'TARJETA_CREDITO',
      'TRANSFERENCIA',
      'CHEQUE',
      'OTRO',
    ])
  })
})

describe('getNextAvailablePaymentMethod', () => {
  it('returns the first method not already used', () => {
    const payments = [{ method: 'EFECTIVO' as PaymentMethod, amount: 100 }]
    expect(getNextAvailablePaymentMethod(payments)).toBe('TARJETA_DEBITO')
  })

  it('skips every method already present, in any order', () => {
    const payments = [
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 50 },
      { method: 'EFECTIVO' as PaymentMethod, amount: 50 },
    ]
    expect(getNextAvailablePaymentMethod(payments)).toBe('TARJETA_CREDITO')
  })

  it('falls back to OTRO when all 6 methods are already used', () => {
    const payments: { method: PaymentMethod; amount: number }[] = [
      { method: 'EFECTIVO', amount: 1 },
      { method: 'TARJETA_DEBITO', amount: 1 },
      { method: 'TARJETA_CREDITO', amount: 1 },
      { method: 'TRANSFERENCIA', amount: 1 },
      { method: 'CHEQUE', amount: 1 },
      { method: 'OTRO', amount: 1 },
    ]
    expect(getNextAvailablePaymentMethod(payments)).toBe('OTRO')
  })
})

describe('rebalanceLastPayment', () => {
  it('sets the last row to total minus the sum of every other row', () => {
    const payments = [
      { method: 'EFECTIVO' as PaymentMethod, amount: 20 },
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 40 },
      { method: 'TRANSFERENCIA' as PaymentMethod, amount: 0 },
    ]
    const result = rebalanceLastPayment(payments, 100)
    expect(result).toEqual([
      { method: 'EFECTIVO', amount: 20 },
      { method: 'TARJETA_DEBITO', amount: 40 },
      { method: 'TRANSFERENCIA', amount: 40 },
    ])
  })

  it('floors the last row at 0 when the other rows already exceed the total', () => {
    const payments = [
      { method: 'EFECTIVO' as PaymentMethod, amount: 70 },
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 50 },
      { method: 'TRANSFERENCIA' as PaymentMethod, amount: 0 },
    ]
    const result = rebalanceLastPayment(payments, 100)
    expect(result[2].amount).toBe(0)
  })

  it('rounds the recalculated amount to 2 decimals', () => {
    const payments = [
      { method: 'EFECTIVO' as PaymentMethod, amount: 33.33 },
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 0 },
    ]
    const result = rebalanceLastPayment(payments, 100)
    expect(result[1].amount).toBe(66.67)
  })

  it('does not mutate the input array', () => {
    const payments = [
      { method: 'EFECTIVO' as PaymentMethod, amount: 20 },
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 0 },
    ]
    const original = payments.map((p) => ({ ...p }))
    rebalanceLastPayment(payments, 100)
    expect(payments).toEqual(original)
  })

  it('returns the array unchanged when there is only one payment', () => {
    const payments = [{ method: 'EFECTIVO' as PaymentMethod, amount: 55 }]
    expect(rebalanceLastPayment(payments, 100)).toEqual(payments)
  })
})
