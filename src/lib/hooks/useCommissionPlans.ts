import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { Role } from '@celhm/types'

export type CommissionBasis = 'SALE_TOTAL' | 'PROFIT'
export type CommissionScope = 'GENERAL' | 'PRODUCT_CATEGORY' | 'CUSTOMER_GROUP'
export type CommissionCalcMethod = 'PERCENTAGE' | 'FIXED'

export interface CommissionRule {
  id: number
  planId: number | null
  membershipId: number | null
  basis: CommissionBasis
  scopeType: CommissionScope
  scopeValue: string | null
  calcMethod: CommissionCalcMethod
  value: number
  validFrom: string
  validTo: string | null
  label: string | null
}

export interface CommissionPlan {
  id: number
  name: string
  role: Role | null
  active: boolean
  rules: CommissionRule[]
}

export interface CommissionRulePreviewResult {
  scopeLabel: string
  ruleId: number
  basis: CommissionBasis
  calcMethod: CommissionCalcMethod
  value: number
}

export interface CommissionRuleInput {
  basis: CommissionBasis
  scopeType: CommissionScope
  scopeValue?: string
  calcMethod: CommissionCalcMethod
  value: number
  label?: string
}

export interface CommissionRuleReviseInput {
  calcMethod: CommissionCalcMethod
  value: number
  label?: string
}

export function useCommissionPlans() {
  return useQuery<CommissionPlan[]>({
    queryKey: ['commission-plans'],
    queryFn: async () => {
      const response = await api.get<CommissionPlan[]>('/commissions/plans')
      return response.data
    },
  })
}

export function useCreateCommissionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; role?: Role }) => {
      const response = await api.post<CommissionPlan>('/commissions/plans', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] })
    },
  })
}

export function useUpdateCommissionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; active?: boolean } }) => {
      const response = await api.patch<CommissionPlan>(`/commissions/plans/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] })
    },
  })
}

export function useDeactivateCommissionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<CommissionPlan>(`/commissions/plans/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] })
    },
  })
}

export function useAddCommissionRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, data }: { planId: number; data: CommissionRuleInput }) => {
      const response = await api.post<CommissionRule>(`/commissions/plans/${planId}/rules`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] })
    },
  })
}

export function useReviseCommissionRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CommissionRuleReviseInput }) => {
      const response = await api.put<CommissionRule>(`/commissions/rules/${id}/revise`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] })
      queryClient.invalidateQueries({ queryKey: ['commission-overrides'] })
    },
  })
}

export function useDeleteCommissionRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/commissions/rules/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] })
      queryClient.invalidateQueries({ queryKey: ['commission-overrides'] })
    },
  })
}

export function useCommissionOverrides(membershipId: number | null) {
  return useQuery<CommissionRule[]>({
    queryKey: ['commission-overrides', membershipId],
    queryFn: async () => {
      const response = await api.get<CommissionRule[]>('/commissions/rules/overrides', {
        params: { membershipId },
      })
      return response.data
    },
    enabled: membershipId !== null,
  })
}

export function useCreateCommissionOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CommissionRuleInput & { membershipId: number }) => {
      const response = await api.post<CommissionRule>('/commissions/rules/override', data)
      return response.data
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commission-overrides', variables.membershipId] })
    },
  })
}

export function useCommissionRulePreview(membershipId: number | null, date: string | null) {
  return useQuery<CommissionRulePreviewResult[]>({
    queryKey: ['commission-preview', membershipId, date],
    queryFn: async () => {
      const response = await api.get<CommissionRulePreviewResult[]>('/commissions/rules/preview', {
        params: { membershipId, date },
      })
      return response.data
    },
    enabled: membershipId !== null && date !== null,
  })
}

export function useCommissionCategories() {
  return useQuery<string[]>({
    queryKey: ['commission-categories'],
    queryFn: async () => {
      const response = await api.get<string[]>('/commissions/categories')
      return response.data
    },
  })
}
