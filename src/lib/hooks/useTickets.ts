import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { Ticket, ApiResponse, TicketState, CreateTicketRequest, UpdateTicketRequest, UpdateTicketStateRequest } from '@celhm/types'

interface GetTicketsParams {
  state?: TicketState
  search?: string
  page?: number
  pageSize?: number
  branchId?: number
  startDate?: Date
  endDate?: Date
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  kanban?: boolean
}

export function useTickets(params: GetTicketsParams = {}) {
  return useQuery<ApiResponse<Ticket>>({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.state) queryParams.append('state', params.state)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
      if (params.branchId) queryParams.append('branchId', params.branchId.toString())
      if (params.startDate) queryParams.append('startDate', params.startDate.toISOString())
      if (params.endDate) queryParams.append('endDate', params.endDate.toISOString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      if (params.kanban) queryParams.append('kanban', 'true')

      const response = await api.get<ApiResponse<Ticket>>(`/tickets?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
  })
}

export function useTicket(id: number) {
  return useQuery<Ticket>({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const response = await api.get<Ticket>(`/tickets/${id}`)
      return response.data
    },
    enabled: !!id,
    retry: false,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTicketRequest) => {
      const response = await api.post<Ticket>('/tickets', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTicketRequest }) => {
      const response = await api.patch<Ticket>(`/tickets/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] })
    },
  })
}

export function useUpdateTicketState() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTicketStateRequest }) => {
      const response = await api.patch<Ticket>(`/tickets/${id}/estado`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] })
    },
  })
}

