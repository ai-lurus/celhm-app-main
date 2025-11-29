import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

// Types matching backend response
interface StockItemResponse {
  id: number
  qty: number
  min: number
  max: number
  reserved: number
  variant: {
    id: number
    sku: string
    name: string
    brand: string
    model: string
    price: number
    product: {
      id: number
      name: string
      category: string
      brand: string
      model: string
    }
  }
}

interface StockResponse {
  data: StockItemResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Frontend InventoryItem type (mapped from backend)
export interface InventoryItem {
  id: number
  sku: string
  name: string
  brand: string
  model: string
  qty: number
  min: number
  max: number
  reserved: number
  price: number
  status: 'normal' | 'low' | 'critical'
  categoryId: number
  variantId: number
}

// Helper to map backend response to frontend format
function mapStockItemToInventoryItem(item: StockItemResponse): InventoryItem {
  const status: 'normal' | 'low' | 'critical' =
    item.qty <= 0 ? 'critical' : item.qty <= item.min ? 'low' : 'normal'

  return {
    id: item.id,
    sku: item.variant.sku || '',
    name: item.variant.name || item.variant.product.name,
    brand: item.variant.brand || item.variant.product.brand || '',
    model: item.variant.model || item.variant.product.model || '',
    qty: item.qty,
    min: item.min,
    max: item.max,
    reserved: item.reserved,
    price: item.variant.price || 0,
    status,
    categoryId: 0, // TODO: Get from product.category when available
    variantId: item.variant.id,
  }
}

interface GetStockParams {
  sucursal?: number
  marca?: string
  modelo?: string
  estado?: 'normal' | 'low' | 'critical'
  categoriaId?: string
  q?: string
  page?: number
  pageSize?: number
}

export function useStock(params: GetStockParams = {}) {
  return useQuery({
    queryKey: ['stock', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.sucursal) queryParams.append('sucursal', params.sucursal.toString())
      if (params.marca) queryParams.append('marca', params.marca)
      if (params.modelo) queryParams.append('modelo', params.modelo)
      if (params.estado) queryParams.append('estado', params.estado)
      if (params.categoriaId) queryParams.append('categoriaId', params.categoriaId)
      if (params.q) queryParams.append('q', params.q)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<StockResponse>(`/stock?${queryParams.toString()}`)
      return {
        data: response.data.data.map(mapStockItemToInventoryItem),
        pagination: response.data.pagination,
      }
    },
  })
}

interface CreateInventoryItemDto {
  branchId?: number
  name: string
  brand?: string
  model?: string
  sku?: string
  price?: number
  qty: number
  min: number
  max?: number
}

interface UpdateInventoryItemDto {
  name?: string
  brand?: string
  model?: string
  sku?: string
  price?: number
  initial_stock?: number
  min_stock?: number
  max_stock?: number
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateInventoryItemDto) => {
      const response = await api.post('/stock/items', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateInventoryItemDto }) => {
      const response = await api.patch(`/stock/items/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/stock/items/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}

