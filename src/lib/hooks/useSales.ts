import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { ApiResponse } from '@celhm/types'

export type SaleStatus = 'PENDING' | 'PAID' | 'CANCELLED'
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE' | 'OTRO'

export interface SaleLine {
  id: number
  saleId: number
  variantId?: number
  ticketId?: number
  description: string
  qty: number
  unitPrice: number
  discount: number
  subtotal: number
}

export interface Payment {
  id: number
  saleId: number
  amount: number
  method: PaymentMethod
  reference?: string
  createdAt: string
}

export interface Sale {
  id: number
  folio: string
  branchId: number
  customerId?: number
  ticketId?: number
  status: SaleStatus
  subtotal: number
  discount: number
  total: number
  paidAmount: number
  createdAt: string
  updatedAt: string
  lines: SaleLine[]
  payments: Payment[]
  customer?: {
    id: number
    name: string
    phone: string
  }
  ticket?: {
    id: number
    folio: string
  }
}

export interface CreateSaleLine {
  variantId?: number
  ticketId?: number
  description: string
  qty: number
  unitPrice: number
  discount?: number
}

export interface CreateSaleRequest {
  branchId: number
  customerId?: number
  ticketId?: number
  lines: CreateSaleLine[]
  discount?: number
  cashRegisterId?: number
  payment?: {
    amount: number
    method: PaymentMethod
    reference?: string
  }
}

export interface AddPaymentRequest {
  amount: number
  method: PaymentMethod
  reference?: string
}

interface GetSalesParams {
  branchId?: number
  customerId?: number
  ticketId?: number
  status?: SaleStatus
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export function useSales(params: GetSalesParams = {}) {
  return useQuery<ApiResponse<Sale>>({
    queryKey: ['sales', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.branchId) queryParams.append('branchId', params.branchId.toString())
      if (params.customerId) queryParams.append('customerId', params.customerId.toString())
      if (params.ticketId) queryParams.append('ticketId', params.ticketId.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<ApiResponse<Sale>>(`/sales?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
  })
}

export function useSale(id: number) {
  return useQuery<Sale>({
    queryKey: ['sales', id],
    queryFn: async () => {
      const response = await api.get<Sale>(`/sales/${id}`)
      return response.data
    },
    enabled: !!id,
    retry: false,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSaleRequest) => {
      const response = await api.post<Sale>('/sales', data)
      return response.data
    },
    onSuccess: () => {
      // Invalidar todas las queries de ventas para forzar el refetch
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useAddPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ saleId, data }: { saleId: number; data: AddPaymentRequest }) => {
      const response = await api.post<Payment>(`/sales/${saleId}/payments`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales', variables.saleId] })
    },
  })
}

