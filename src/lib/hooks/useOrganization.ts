import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface Organization {
  id: number
  name: string
  slug: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  taxId?: string
  website?: string
  currency?: string
  timezone?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateOrganizationRequest {
  name?: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  taxId?: string
  website?: string
  currency?: string
  timezone?: string
}

export function useOrganization() {
  return useQuery<Organization>({
    queryKey: ['organization'],
    queryFn: async () => {
      const response = await api.get<any>('/orgs/me')
      const data = response.data
      // Map the response to our Organization interface
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logo: data.logo || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        taxId: data.taxId || undefined,
        website: data.website || undefined,
        currency: data.currency || undefined,
        timezone: data.timezone || undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
    },
    retry: false,
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateOrganizationRequest) => {
      const response = await api.patch<Organization>('/orgs/me', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
  })
}

