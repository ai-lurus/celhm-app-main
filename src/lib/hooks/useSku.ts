import { useQuery } from "@tanstack/react-query"
import { api } from "../api"

export function useSkuPreview(categoryId: number | null | undefined, productName: string) {
  const enabled = Boolean(categoryId) && productName.trim().length > 0

  return useQuery<{ sku: string }>({
    queryKey: ["catalog", "sku-preview", categoryId, productName],
    queryFn: async () => {
      const response = await api.get<{ sku: string }>(
        `/catalog/sku/preview?categoryId=${categoryId}&name=${encodeURIComponent(productName)}`,
      )
      return response.data
    },
    enabled,
    retry: false,
    staleTime: 0,
  })
}
