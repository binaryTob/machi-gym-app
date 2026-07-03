export interface StudentProfile {
  id: string
  studentId: string
}

export interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  height: number
  age: number
  lifestyle: string
  limitations: string | null
  weeklyFrequency: number
  windowSize: number
  profile: StudentProfile | null
  createdAt: string
  updatedAt: string
}

export interface CreateStudentDTO {
  firstName: string
  lastName: string
  email: string
  height: number
  age: number
  lifestyle: 'sedentario' | 'activo' | 'muy_activo'
  limitations?: string
  weeklyFrequency: 3 | 5
}

export type UpdateStudentDTO = Partial<CreateStudentDTO>
