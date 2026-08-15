import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useProducts } from './useCatalog'
import { api } from '../api'

jest.mock('../api')
const mockApi = api as jest.Mocked<typeof api>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => QueryClientProvider({ client: queryClient, children })
}

describe('useProducts', () => {
  beforeEach(() => jest.clearAllMocks())

  it('maps categoryId and category name from the relation', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Cable USB-C',
            categoryId: 2,
            category: { id: 2, name: 'Cables' },
            createdAt: '',
          },
        ],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
    })

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data[0].categoryId).toBe(2)
    expect(result.current.data?.data[0].category).toBe('Cables')
  })
})
