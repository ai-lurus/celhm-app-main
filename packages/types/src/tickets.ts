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
  condition: z.string().optional(),
  accessories: z.string().optional(),
  risk: z.string().optional(),
  advancePayment: z.number().optional(),
  internalNotes: z.string().optional(),
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

export const TicketSchema = z.object({
  id: z.number(),
  folio: z.string(),
  branchId: z.number(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  device: z.string(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  problem: z.string(),
  diagnosis: z.string().optional(),
  solution: z.string().optional(),
  state: TicketState,
  estimatedCost: z.number().optional(),
  finalCost: z.number().optional(),
  estimatedTime: z.number().optional(),
  warrantyDays: z.number().optional(),
  condition: z.string().optional(),
  accessories: z.string().optional(),
  risk: z.string().optional(),
  advancePayment: z.number().optional(),
  internalNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  branch: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
  }).optional(),
  parts: z.array(z.object({
    id: z.number(),
    variantId: z.number(),
    qty: z.number(),
    state: TicketPartState,
    variant: z.object({
      id: z.number(),
      sku: z.string(),
      name: z.string(),
    }).optional(),
  })).optional(),
})

export const UpdateTicketSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  device: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  problem: z.string().optional(),
  diagnosis: z.string().optional(),
  solution: z.string().optional(),
  estimatedCost: z.number().optional(),
  finalCost: z.number().optional(),
  estimatedTime: z.number().optional(),
  warrantyDays: z.number().optional(),
  condition: z.string().optional(),
  accessories: z.string().optional(),
  risk: z.string().optional(),
  advancePayment: z.number().optional(),
  internalNotes: z.string().optional(),
})

export type Ticket = z.infer<typeof TicketSchema>
export type CreateTicketRequest = z.infer<typeof CreateTicketSchema>
export type UpdateTicketStateRequest = z.infer<typeof UpdateTicketStateSchema>
export type UpdateTicketRequest = z.infer<typeof UpdateTicketSchema>
export type AddTicketPartRequest = z.infer<typeof AddTicketPartSchema>
