import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { ApiResponse } from '@celhm/types'

export interface CashRegister {
  id: number
  branchId: number
  name: string
  isActive: boolean
  createdAt: string
}

export interface CashCut {
  id: number
  branchId: number
  cashRegisterId: number
  date: string
  initialAmount: number
  finalAmount: number
  expectedAmount: number
  declaredAmount: number
  difference: number
  salesByMethod: {
    method: string
    amount: number
  }[]
  totalSales: number
  totalPayments: number
  notes?: string
  createdAt: string
  cashRegister?: CashRegister
}

export interface CreateCashCutRequest {
  branchId: number
  cashRegisterId: number
  date: string
  declaredAmount: number
  initialAmount: number
  notes?: string
}

export interface CreateCashRegisterRequest {
  branchId: number
  name: string
}

interface GetCashCutsParams {
  branchId: number
  cashRegisterId?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export function useCashRegisters(branchId: number) {
  return useQuery<CashRegister[]>({
    queryKey: ['cash', 'registers', branchId],
    queryFn: async () => {
      const response = await api.get<CashRegister[]>(`/cash/registers?branchId=${branchId}`)
      return response.data
    },
    enabled: !!branchId,
    retry: false,
  })
}

export function useCashCuts(params: GetCashCutsParams) {
  return useQuery<ApiResponse<CashCut>>({
    queryKey: ['cash', 'cuts', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      queryParams.append('branchId', params.branchId.toString())
      if (params.cashRegisterId) queryParams.append('cashRegisterId', params.cashRegisterId.toString())
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<ApiResponse<CashCut>>(`/cash/cuts?${queryParams.toString()}`)
      return response.data
    },
    enabled: !!params.branchId,
    retry: false,
  })
}

export function useCashCut(id: number) {
  return useQuery({
    queryKey: ['cash', 'cuts', id],
    queryFn: async () => {
      const response = await api.get<CashCut>(`/cash/cuts/${id}`)
      return response.data
    },
    enabled: !!id,
    retry: false,
  })
}

export function useCreateCashCut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCashCutRequest) => {
      const response = await api.post<CashCut>('/cash/cuts', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash'] })
    },
  })
}

export function useCreateCashRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCashRegisterRequest) => {
      const response = await api.post<CashRegister>('/cash/registers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash', 'registers'] })
    },
  })
}
