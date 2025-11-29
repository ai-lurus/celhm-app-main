import { z } from 'zod'

export const MovementType = z.enum(['ING', 'EGR', 'VTA', 'AJU', 'TRF_OUT', 'TRF_IN'])
export type MovementType = z.infer<typeof MovementType>

export const MovementSchema = z.object({
  id: z.number(),
  branchId: z.number(),
  variantId: z.number(),
  type: MovementType,
  qty: z.number(),
  reason: z.string().optional(),
  folio: z.string().optional(),
  ticketId: z.number().optional(),
  userId: z.number().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.string(),
  variant: z.object({
    id: z.number(),
    sku: z.string(),
    name: z.string(),
    brand: z.string().optional(),
    model: z.string().optional(),
    product: z.object({
      id: z.number(),
      name: z.string(),
      category: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
    }),
  }).optional(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  branch: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
  }).optional(),
})

export type Movement = z.infer<typeof MovementSchema>

