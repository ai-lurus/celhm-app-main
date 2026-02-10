import { PaymentMethod, CreateSaleLine } from '../../../../lib/hooks/useSales'

export interface SaleLineItem {
  variantId?: number
  code: string
  product: string
  qty: number
  unitPrice: number
  advance?: number // Anticipo para órdenes de reparación
  amount: number
}

export interface CashRegisterForm {
  date: string
  customerId: string
  customerName: string
  requestInvoice: boolean
  sellerId: string
  paymentMethod: PaymentMethod
  lines: SaleLineItem[]
  discount: number
  discountPercent: boolean
  productSearch: string
  productDetails: string
  ticketDetails: string
  cashRegisterId?: number
}

export const createInitialCashRegisterForm = (sellerId: string = ''): CashRegisterForm => ({
  date: new Date().toISOString().split('T')[0],
  customerId: '',
  customerName: 'CLIENTE DE MOSTRADOR',
  requestInvoice: false,
  sellerId,
  cashRegisterId: undefined,
  paymentMethod: 'EFECTIVO',
  lines: [],
  discount: 0,
  discountPercent: false,
  productSearch: '',
  productDetails: '',
  ticketDetails: '',
})
