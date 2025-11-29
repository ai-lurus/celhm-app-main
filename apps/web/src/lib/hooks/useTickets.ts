import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { Ticket, ApiResponse, TicketState } from '@celhm/types'

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
  })
}

