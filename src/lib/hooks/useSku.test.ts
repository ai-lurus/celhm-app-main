import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSkuPreview } from './useSku'
import { api } from '../api'

jest.mock('../api')
const mockApi = api as jest.Mocked<typeof api>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => QueryClientProvider({ client: queryClient, children })
}

describe('useSkuPreview', () => {
  beforeEach(() => jest.clearAllMocks())

  it('fetches the preview when categoryId and name are present', async () => {
    mockApi.get.mockResolvedValue({ data: { sku: 'CAC0001' } })

    const { result } = renderHook(() => useSkuPreview(2, 'Cable USB-C'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.sku).toBe('CAC0001')
    expect(mockApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/catalog/sku/preview?categoryId=2&name=Cable%20USB-C'),
    )
  })

  it('does not fetch when categoryId is missing', () => {
    renderHook(() => useSkuPreview(undefined, 'Cable USB-C'), { wrapper: createWrapper() })

    expect(mockApi.get).not.toHaveBeenCalled()
  })
})
