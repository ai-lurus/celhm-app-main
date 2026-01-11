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

interface ProductsResponse {
  data: Product[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function useProducts(params: GetProductsParams = {}) {
  return useQuery<ProductsResponse>({
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

export interface Category {
  id: number
  name: string
  parentId?: number | null
  children?: Category[]
}

export interface Brand {
  id: number
  name: string
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['catalog', 'categories'],
    queryFn: async (): Promise<Category[]> => {
      try {
        // Try to get as objects with id and name
        const response = await api.get<Category[] | string[]>('/catalog/categories')
        // If response is array of objects, return as is
        if (Array.isArray(response.data) && response.data.length > 0 && typeof response.data[0] === 'object' && 'id' in response.data[0]) {
          return response.data as Category[]
        }
        // If response is array of strings, convert to objects
        if (Array.isArray(response.data) && typeof response.data[0] === 'string') {
          return (response.data as string[]).map((name, index) => ({ id: index + 1, name }))
        }
        return response.data as Category[]
      } catch (error) {
        // Fallback: try string array endpoint
        const response = await api.get<string[]>('/catalog/categories')
        return (response.data as string[]).map((name, index) => ({ id: index + 1, name }))
      }
    },
  })
}

export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: ['catalog', 'brands'],
    queryFn: async (): Promise<Brand[]> => {
      try {
        // Try to get as objects with id and name
        const response = await api.get<Brand[] | string[]>('/catalog/brands')
        // If response is array of objects, return as is
        if (Array.isArray(response.data) && response.data.length > 0 && typeof response.data[0] === 'object' && 'id' in response.data[0]) {
          return response.data as Brand[]
        }
        // If response is array of strings, convert to objects
        if (Array.isArray(response.data) && typeof response.data[0] === 'string') {
          return (response.data as string[]).map((name, index) => ({ id: index + 1, name }))
        }
        return response.data as Brand[]
      } catch (error) {
        // Fallback: try string array endpoint
        const response = await api.get<string[]>('/catalog/brands')
        return (response.data as string[]).map((name, index) => ({ id: index + 1, name }))
      }
    },
  })
}

// Category CRUD hooks
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; parentId?: number | null }) => {
      const response = await api.post<Category>('/catalog/categories', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; parentId?: number | null } }) => {
      const response = await api.patch<Category>(`/catalog/categories/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/catalog/categories/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
    },
  })
}

// Brand CRUD hooks
export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await api.post<Brand>('/catalog/brands', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'brands'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => {
      const response = await api.patch<Brand>(`/catalog/brands/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'brands'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
    },
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/catalog/brands/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'brands'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
    },
  })
}

