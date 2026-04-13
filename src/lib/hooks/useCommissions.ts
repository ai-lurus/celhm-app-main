import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export type CommissionStatus = 'PENDIENTE' | 'PAGADA' | 'CANCELADA'

export interface Commission {
  id: number
  saleId: number
  ticketId: number
  userId: number
  amount: number
  rate: number
  saleTotal: number
  status: CommissionStatus
  paidAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: number
    name: string | null
    email: string | null
  }
  sale: {
    id: number
    folio: string
    total: number
    subtotal: number
    createdAt: string
  }
  ticket: {
    id: number
    folio: string
    customerName: string
    device: string
  }
}

export interface CommissionSummary {
  userId: number
  userName: string | null
  userEmail: string | null
  commissionRate: number | null
  pendingAmount: number
  paidAmount: number
  totalAmount: number
  pendingCount: number
  paidCount: number
}

interface GetCommissionsParams {
  userId?: number
  status?: CommissionStatus
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

interface CommissionsResponse {
  data: Commission[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function useCommissions(params: GetCommissionsParams = {}) {
  return useQuery<CommissionsResponse>({
    queryKey: ['commissions', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.userId) queryParams.append('userId', params.userId.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<CommissionsResponse>(`/commissions?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
  })
}

export function useCommissionSummary() {
  return useQuery<CommissionSummary[]>({
    queryKey: ['commissions', 'summary'],
    queryFn: async () => {
      const response = await api.get<CommissionSummary[]>('/commissions/summary')
      return response.data
    },
    retry: false,
  })
}

export function usePayCommission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commissionId: number) => {
      const response = await api.patch(`/commissions/${commissionId}/pay`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
    },
  })
}

export function usePayCommissionBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await api.patch('/commissions/pay-batch', { ids })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
    },
  })
}

export function useExportCommissions() {
  return useMutation({
    mutationFn: async (params: GetCommissionsParams = {}) => {
      const queryParams = new URLSearchParams()
      if (params.userId) queryParams.append('userId', params.userId.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)

      const response = await api.get(`/commissions/export?${queryParams.toString()}`, {
        responseType: 'blob',
      })

      // Trigger download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `comisiones_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}
