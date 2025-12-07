import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { CreateMovementRequest, MovementType } from '@celhm/types'

export type FrontendMovementType = 'entrada' | 'salida'

export function useCreateMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { branchId: number; variantId: number; type: FrontendMovementType; qty: number; reason?: string; folio?: string; ticketId?: number }) => {
      const backendData: CreateMovementRequest = {
        ...data,
        // Backend uses: ING (entrada), EGR (salida), VTA (venta), AJU (ajuste), TRF_OUT, TRF_IN
        type: data.type === 'entrada' ? 'ING' : 'EGR',
      }
      const response = await api.post('/movements', backendData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate stock query to refresh inventory after movement
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}

