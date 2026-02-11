
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export interface StockAlert {
    id: number
    branchId: number
    variantId: number
    qty: number
    min: number
    max: number
    reserved: number
    variant: {
        id: number
        productId: number
        sku: string
        name: string | null
        product: {
            name: string
            brand: string | null
            model: string | null
        }
    }
    branch: {
        name: string
        code: string
    }
}

export function useStockAlerts() {
    return useQuery<StockAlert[]>({
        queryKey: ['stock-alerts'],
        queryFn: async () => {
            const response = await api.get<StockAlert[]>('/stock/alerts')
            return response.data
        },
        // Refresh every minute to keep alerts up to date
        refetchInterval: 60 * 1000,
    })
}
