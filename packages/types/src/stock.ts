import { z } from 'zod'

export const StockItemSchema = z.object({
  id: z.number(),
  branchId: z.number(),
  variantId: z.number(),
  qty: z.number(),
  min: z.number(),
  max: z.number(),
  reserved: z.number(),
  variant: z.object({
    id: z.number(),
    sku: z.string(),
    name: z.string(),
    brand: z.string().optional(),
    model: z.string().optional(),
    price: z.number().optional(),
    product: z.object({
      id: z.number(),
      name: z.string(),
      category: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
    }),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const StockStatusSchema = z.enum(['normal', 'low', 'critical'])
export type StockStatus = z.infer<typeof StockStatusSchema>

export const CreateInventoryItemSchema = z.object({
  branchId: z.number().optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0).optional(),
  purchasePrice: z.number().min(0).optional(),
  barcode: z.string().optional(),
  qty: z.number().min(0),
  min: z.number().min(0),
  max: z.number().min(0).optional(),
})

export const UpdateInventoryItemSchema = z.object({
  name: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0).optional(),
  purchasePrice: z.number().min(0).optional(),
  barcode: z.string().optional(),
  initial_stock: z.number().min(0).optional(),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional(),
})

export type StockItem = z.infer<typeof StockItemSchema>
export type CreateInventoryItemRequest = z.infer<typeof CreateInventoryItemSchema>
export type UpdateInventoryItemRequest = z.infer<typeof UpdateInventoryItemSchema>

