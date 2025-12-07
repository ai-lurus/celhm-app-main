import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export interface Branch {
  id: number
  name: string
  code: string
  address?: string
  phone?: string
  isActive: boolean
}

export function useBranches() {
  return useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get<Branch[]>('/branches')
      return response.data
    },
    retry: false,
    onError: (error: any) => {
      console.error('Error loading branches:', error)
    },
  })
}

