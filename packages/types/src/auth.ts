import { z } from 'zod'

export const Role = z.enum(['DIRECCION', 'ADMON', 'LABORATORIO'])
export type Role = z.infer<typeof Role>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const AuthUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: Role,
  organizationId: z.number(),
  branchId: z.number().optional(),
})

export type LoginRequest = z.infer<typeof LoginSchema>
export type AuthUser = z.infer<typeof AuthUserSchema>

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  user: AuthUserSchema,
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

