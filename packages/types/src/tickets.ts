import { z } from 'zod'

export const TicketState = z.enum([
  'RECIBIDO',
  'DIAGNOSTICO',
  'ESPERANDO_PIEZA',
  'EN_REPARACION',
  'REPARADO',
  'ENTREGADO',
  'CANCELADO',
])
export type TicketState = z.infer<typeof TicketState>

export const TicketPartState = z.enum(['RESERVADA', 'CONSUMIDA', 'LIBERADA'])
export type TicketPartState = z.infer<typeof TicketPartState>

export const CreateTicketSchema = z.object({
  branchId: z.number(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  device: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  problem: z.string().min(1),
  diagnosis: z.string().optional(),
  solution: z.string().optional(),
  estimatedCost: z.number().optional(),
  finalCost: z.number().optional(),
  estimatedTime: z.number().optional(),
  warrantyDays: z.number().optional(),
})

export const UpdateTicketStateSchema = z.object({
  state: TicketState,
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  solution: z.string().optional(),
  estimatedCost: z.number().optional(),
  finalCost: z.number().optional(),
})

export const AddTicketPartSchema = z.object({
  variantId: z.number(),
  qty: z.number().min(1),
})

export type CreateTicketRequest = z.infer<typeof CreateTicketSchema>
export type UpdateTicketStateRequest = z.infer<typeof UpdateTicketStateSchema>
export type AddTicketPartRequest = z.infer<typeof AddTicketPartSchema>

