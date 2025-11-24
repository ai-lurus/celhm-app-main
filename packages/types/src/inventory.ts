import { z } from 'zod'

export const MovementType = z.enum(['ING', 'EGR', 'VTA', 'AJU', 'TRF_OUT', 'TRF_IN'])
export type MovementType = z.infer<typeof MovementType>

export const CreateMovementSchema = z.object({
  branchId: z.number(),
  variantId: z.number(),
  type: MovementType,
  qty: z.number().min(1),
  reason: z.string().optional(),
  folio: z.string().optional(),
  ticketId: z.number().optional(),
})

export const UpdateStockMinSchema = z.object({
  branchId: z.number(),
  variantId: z.number(),
  min: z.number().min(0),
})

export type CreateMovementRequest = z.infer<typeof CreateMovementSchema>
export type UpdateStockMinRequest = z.infer<typeof UpdateStockMinSchema>

