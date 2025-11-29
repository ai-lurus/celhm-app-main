import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export type MovementType = 'entrada' | 'salida'

interface CreateMovementDto {
  branchId: number
  variantId: number
  type: MovementType
  qty: number
  reason?: string
  folio?: string
  ticketId?: number
}

export function useCreateMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMovementDto) => {
      const response = await api.post('/movements', {
        ...data,
        // Backend uses: ING (entrada), EGR (salida), VTA (venta), AJU (ajuste), TRF_OUT, TRF_IN
        type: data.type === 'entrada' ? 'ING' : 'EGR',
      })
      return response.data
    },
    onSuccess: () => {
      // Invalidate stock query to refresh inventory after movement
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}

