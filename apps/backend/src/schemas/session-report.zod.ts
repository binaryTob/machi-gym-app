import { z } from 'zod'

const SessionReportCreateSchema = z.object({
  studentId: z.string(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long (max 10000 characters)'),
})

const SessionReportResponseSchema = SessionReportCreateSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  student: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string()
  })
})

export const sessionReportZodSchemas = {
  CreateSessionReportDTO: SessionReportCreateSchema,
  SessionReportResponseDTO: SessionReportResponseSchema
}

export type CreateSessionReportDTO = z.infer<typeof SessionReportCreateSchema>
export type SessionReportResponseDTO = z.infer<typeof SessionReportResponseSchema>