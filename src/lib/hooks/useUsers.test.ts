import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUpdateMember } from './useUsers'
import { api } from '../api'

jest.mock('../api')
const mockApi = api as jest.Mocked<typeof api>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => QueryClientProvider({ client: queryClient, children })
}

describe('useUpdateMember', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('patches the member without a commissionRate key, so a stored rate is never wiped', async () => {
    mockApi.patch.mockResolvedValue({ data: { id: 4 } })

    const { result } = renderHook(() => useUpdateMember(), { wrapper: createWrapper() })
    // A stale caller that still passes the field must not get it onto the wire either.
    result.current.mutate({ id: 4, role: 'ADMINISTRADOR', branchId: null, commissionPlanId: 5, commissionRate: null } as any)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [url, body] = mockApi.patch.mock.calls[0]
    expect(url).toBe('/orgs/members/4')
    expect(Object.keys(body as object)).not.toContain('commissionRate')
    expect(body).toEqual({ role: 'ADMINISTRADOR', branchId: null, commissionPlanId: 5 })
  })
})
