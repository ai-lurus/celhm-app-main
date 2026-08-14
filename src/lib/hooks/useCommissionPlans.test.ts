import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useCommissionPlans,
  useCreateCommissionPlan,
  useAddCommissionRule,
  useCommissionOverrides,
  useCommissionRulePreview,
} from './useCommissionPlans'
import { api } from '../api'

jest.mock('../api')
const mockApi = api as jest.Mocked<typeof api>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => QueryClientProvider({ client: queryClient, children })
}

describe('useCommissionPlans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches plans from /commissions/plans', async () => {
    mockApi.get.mockResolvedValue({ data: [{ id: 1, name: 'Vendedor', role: null, active: true, rules: [] }] })

    const { result } = renderHook(() => useCommissionPlans(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/commissions/plans')
    expect(result.current.data?.[0].name).toBe('Vendedor')
  })

  it('posts a new plan to /commissions/plans', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 1, name: 'Técnico', role: 'TECNICO', active: true, rules: [] } })

    const { result } = renderHook(() => useCreateCommissionPlan(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Técnico', role: 'TECNICO' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/commissions/plans', { name: 'Técnico', role: 'TECNICO' })
  })

  it('posts a new rule to /commissions/plans/:id/rules', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 1 } })

    const { result } = renderHook(() => useAddCommissionRule(), { wrapper: createWrapper() })
    result.current.mutate({
      planId: 7,
      data: { basis: 'SALE_TOTAL', scopeType: 'GENERAL', calcMethod: 'PERCENTAGE', value: 5 },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/commissions/plans/7/rules', {
      basis: 'SALE_TOTAL',
      scopeType: 'GENERAL',
      calcMethod: 'PERCENTAGE',
      value: 5,
    })
  })

  it('does not fetch overrides when membershipId is null', () => {
    const { result } = renderHook(() => useCommissionOverrides(null), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('fetches overrides with membershipId as a query param when set', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useCommissionOverrides(9), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/commissions/rules/overrides', { params: { membershipId: 9 } })
  })

  it('does not fetch a preview until both membershipId and date are set', () => {
    const { result } = renderHook(() => useCommissionRulePreview(null, null), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockApi.get).not.toHaveBeenCalled()
  })
})
