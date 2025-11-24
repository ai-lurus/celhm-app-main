import { z } from 'zod'

export const NotificationChannel = z.enum(['EMAIL', 'SMS', 'WHATSAPP'])
export type NotificationChannel = z.infer<typeof NotificationChannel>

export const SendNotificationSchema = z.object({
  code: z.string(),
  recipient: z.string(),
  variables: z.record(z.any()),
  subject: z.string().optional(),
})

export type SendNotificationRequest = z.infer<typeof SendNotificationSchema>

