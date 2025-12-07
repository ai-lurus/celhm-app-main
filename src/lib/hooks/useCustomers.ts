import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { ApiResponse } from '@celhm/types'

export interface Customer {
  id: number
  name: string
  phone: string
  email?: string
  notes?: string
  branchId?: number
  isWholesale?: boolean
  isCorporate?: boolean
  createdAt: string
  updatedAt: string
  tickets?: any[]
  sales?: any[]
}

export interface CreateCustomerRequest {
  name: string
  phone: string
  email?: string
  notes?: string
  branchId?: number
  isWholesale?: boolean
  isCorporate?: boolean
}

export interface UpdateCustomerRequest {
  name?: string
  phone?: string
  email?: string
  notes?: string
  branchId?: number
  isWholesale?: boolean
  isCorporate?: boolean
}

interface GetCustomersParams {
  q?: string
  branchId?: number
  page?: number
  pageSize?: number
}

export function useCustomers(params: GetCustomersParams = {}) {
  return useQuery<ApiResponse<Customer>>({
    queryKey: ['customers', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.q) queryParams.append('q', params.q)
      if (params.branchId) queryParams.append('branchId', params.branchId.toString())
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<ApiResponse<Customer>>(`/customers?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
  })
}

export function useCustomer(id: number) {
  return useQuery<Customer>({
    queryKey: ['customers', id],
    queryFn: async () => {
      const response = await api.get<Customer>(`/customers/${id}`)
      return response.data
    },
    enabled: !!id,
    retry: false,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await api.post<Customer>('/customers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCustomerRequest }) => {
      const response = await api.patch<Customer>(`/customers/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/customers/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

