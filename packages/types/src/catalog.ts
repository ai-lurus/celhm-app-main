import { z } from 'zod'

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.number().nullable().optional(),
  category: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  variants: z.array(z.any()).optional(),
  _count: z.object({
    variants: z.number(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isPriceEditable: z.boolean().optional(),
  tracksInventory: z.boolean().optional(),
  isCommissionable: z.boolean().optional(),
})

export const VariantSchema = z.object({
  id: z.number(),
  productId: z.number(),
  sku: z.string(),
  name: z.string(),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  price: z.number().optional(),
  product: z.object({
    id: z.number(),
    name: z.string(),
    categoryId: z.number().nullable().optional(),
    category: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
    isPriceEditable: z.boolean().optional(),
    tracksInventory: z.boolean().optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Product = z.infer<typeof ProductSchema>
export type Variant = z.infer<typeof VariantSchema>

