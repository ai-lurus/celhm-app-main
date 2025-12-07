import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { TicketState } from '@celhm/types'

export interface SalesReport {
  totalSales: number
  totalByPaymentMethod: {
    method: string
    amount: number
    count: number
  }[]
  totalByServiceType: {
    type: string
    amount: number
    count: number
  }[]
  sales: any[]
  period: {
    startDate: string
    endDate: string
    branchId?: number
  }
}

export interface TicketsReport {
  totalTickets: number
  ticketsByState: {
    state: TicketState
    count: number
  }[]
  closedTickets: {
    count: number
    totalRevenue: number
  }
  tickets: any[]
  period: {
    startDate?: string
    endDate?: string
    branchId?: number
    state?: TicketState
  }
}

export interface InventoryReport {
  lowStockItems: {
    id: number
    variantId: number
    branchId: number
    qty: number
    min: number
    variant: {
      id: number
      name: string
      sku: string
    }
    branch: {
      id: number
      name: string
    }
  }[]
  totalValue: number
  totalItems: number
  branchId?: number
}

interface GetSalesReportParams {
  branchId?: number
  startDate: string
  endDate: string
}

interface GetTicketsReportParams {
  branchId?: number
  startDate?: string
  endDate?: string
  state?: TicketState
}

interface GetInventoryReportParams {
  branchId?: number
}

export function useSalesReport(params: GetSalesReportParams) {
  return useQuery<SalesReport>({
    queryKey: ['reports', 'sales', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      queryParams.append('startDate', params.startDate)
      queryParams.append('endDate', params.endDate)
      if (params.branchId) queryParams.append('branchId', params.branchId.toString())

      const response = await api.get<SalesReport>(`/reports/sales?${queryParams.toString()}`)
      return response.data
    },
    enabled: !!params.startDate && !!params.endDate,
    retry: false,
    onError: (error: any) => {
      console.error('Error loading sales report:', error)
    },
  })
}

export function useTicketsReport(params: GetTicketsReportParams = {}) {
  return useQuery<TicketsReport>({
    queryKey: ['reports', 'tickets', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.branchId) queryParams.append('branchId', params.branchId.toString())
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.state) queryParams.append('state', params.state)

      const response = await api.get<TicketsReport>(`/reports/tickets?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
    onError: (error: any) => {
      console.error('Error loading tickets report:', error)
    },
  })
}

export function useInventoryReport(params: GetInventoryReportParams = {}) {
  return useQuery<InventoryReport>({
    queryKey: ['reports', 'inventory', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.branchId) queryParams.append('branchId', params.branchId.toString())

      const response = await api.get<InventoryReport>(`/reports/inventory?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
    onError: (error: any) => {
      console.error('Error loading inventory report:', error)
    },
  })
}

