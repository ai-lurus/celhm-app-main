import { z } from 'zod'

export const PaginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

export const ApiResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: PaginationSchema,
})

export type Pagination = z.infer<typeof PaginationSchema>
export type ApiResponse<T = any> = {
  data: T[]
  pagination: Pagination
}

