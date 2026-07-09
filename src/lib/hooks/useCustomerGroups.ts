import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface CustomerGroup {
  id: number
  name: string
  discountPercent: number
  isDefault: boolean
  isFrequentBuyerTarget: boolean
  _count?: { customers: number }
}

export function useCustomerGroups() {
  return useQuery<CustomerGroup[]>({
    queryKey: ['customer-groups'],
    queryFn: async () => {
      const response = await api.get<CustomerGroup[]>('/customer-groups')
      return response.data
    },
  })
}

export function useCreateCustomerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; discountPercent?: number }) => {
      const response = await api.post<CustomerGroup>('/customer-groups', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-groups'] })
    },
  })
}

export function useUpdateCustomerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; discountPercent?: number } }) => {
      const response = await api.patch<CustomerGroup>(`/customer-groups/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-groups'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useDeleteCustomerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/customer-groups/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-groups'] })
    },
  })
}
