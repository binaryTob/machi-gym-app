import { z } from 'zod'

export const StudentCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  height: z.number().int().positive('Height must be a positive number'),
  age: z.number().int().min(13).max(120, 'Age must be between 13 and 120'),
  lifestyle: z.enum(['sedentario', 'activo', 'muy_activo'], {
    errorMap: () => ({ message: 'Lifestyle must be one of: sedentario, activo, muy_activo' })
  }),
  limitations: z.string().optional(),
  weeklyFrequency: z.number().int().refine(val => [3, 5].includes(val), {
    message: 'Weekly frequency must be 3 or 5'
  })
})

export const StudentUpdateSchema = StudentCreateSchema.partial().extend({
  email: StudentCreateSchema.shape.email.optional(),
  height: StudentCreateSchema.shape.height.optional(),
  age: StudentCreateSchema.shape.age.optional(),
  lifestyle: StudentCreateSchema.shape.lifestyle.optional()
})

export const StudentResponseSchema = StudentCreateSchema.extend({
  id: z.string(),
  windowSize: z.number().int(),
  profile: z.object({
    id: z.string(),
    studentId: z.string()
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const StudentZodSchemas = {
  CreateStudentDTO: StudentCreateSchema,
  UpdateStudentDTO: StudentUpdateSchema,
  StudentResponseDTO: StudentResponseSchema
}

export type CreateStudentDTO = z.infer<typeof StudentCreateSchema>
export type UpdateStudentDTO = z.infer<typeof StudentUpdateSchema>
export type StudentResponseDTO = z.infer<typeof StudentResponseSchema>
