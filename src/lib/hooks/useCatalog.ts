import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { Product as BackendProduct, Variant, ApiResponse } from '@celhm/types'

// Frontend Product type (mapped from backend)
export interface Product {
  id: number
  name: string
  description: string
  category: string
  brand: string
  model: string
  createdAt: string
  variantsCount?: number
}

interface GetProductsParams {
  categoria?: string
  marca?: string
  modelo?: string
  q?: string
  page?: number
  pageSize?: number
}

export function useProducts(params: GetProductsParams = {}) {
  return useQuery({
    queryKey: ['catalog', 'products', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.categoria) queryParams.append('categoria', params.categoria)
      if (params.marca) queryParams.append('marca', params.marca)
      if (params.modelo) queryParams.append('modelo', params.modelo)
      if (params.q) queryParams.append('q', params.q)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<ApiResponse<BackendProduct>>(`/catalog/products?${queryParams.toString()}`)
      return {
        data: response.data.data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          category: p.category || '',
          brand: p.brand || '',
          model: p.model || '',
          createdAt: p.createdAt,
          variantsCount: p._count?.variants || 0,
        })),
        pagination: response.data.pagination,
      }
    },
    retry: false,
    onError: (error: any) => {
      // Normalize error to prevent rendering objects
      console.error('Error loading products:', error)
    },
  })
}

// Using Product type from @celhm/types for responses
// DTOs for create/update can be Partial<Product> or specific types

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<BackendProduct> & { name: string }) => {
      const response = await api.post<BackendProduct>('/catalog/products', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'brands'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BackendProduct> }) => {
      const response = await api.patch<BackendProduct>(`/catalog/products/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'brands'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/catalog/products/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: async () => {
      const response = await api.get<string[]>('/catalog/categories')
      return response.data
    },
  })
}

export function useBrands() {
  return useQuery({
    queryKey: ['catalog', 'brands'],
    queryFn: async () => {
      const response = await api.get<string[]>('/catalog/brands')
      return response.data
    },
  })
}

