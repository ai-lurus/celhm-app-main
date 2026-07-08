import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useStock } from './useStock'
import { api } from '../api'

jest.mock('../api')
const mockApi = api as jest.Mocked<typeof api>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    QueryClientProvider({ client: queryClient, children })
}

describe('useStock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('includes the variant barcode on mapped inventory items', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            branchId: 1,
            variantId: 5,
            qty: 10,
            min: 2,
            max: 100,
            reserved: 0,
            variant: {
              id: 5,
              sku: 'SKU-1',
              name: 'Pantalla',
              price: 100,
              barcode: '7501234567890',
              product: {
                id: 9,
                name: 'Pantalla',
              },
            },
            createdAt: '',
            updatedAt: '',
          },
        ],
        pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
      },
    })

    const { result } = renderHook(() => useStock(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data[0].barcode).toBe('7501234567890')
  })
})
