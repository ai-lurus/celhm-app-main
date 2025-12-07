import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { Ticket, ApiResponse, TicketState, CreateTicketRequest, UpdateTicketRequest, UpdateTicketStateRequest } from '@celhm/types'

interface GetTicketsParams {
  estado?: TicketState
  q?: string
  page?: number
  pageSize?: number
}

export function useTickets(params: GetTicketsParams = {}) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.estado) queryParams.append('estado', params.estado)
      if (params.q) queryParams.append('q', params.q)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<ApiResponse<Ticket>>(`/tickets?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
    onError: (error: any) => {
      console.error('Error loading tickets:', error)
    },
  })
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const response = await api.get<Ticket>(`/tickets/${id}`)
      return response.data
    },
    enabled: !!id,
    retry: false,
    onError: (error: any) => {
      console.error('Error loading ticket:', error)
    },
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

