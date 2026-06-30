// Type definitions for Phase 5 components
type Session = {
  id: string
  name?: string
  generatedAt?: string
  createdAt?: string
  content?: string
  exercises?: Exercise[]
  exerciseLogs?: ExerciseLog[]
  student?: {
    id: string
    firstName: string
    lastName: string
  }
}

type Exercise = {
  id: string
  name: string
  reps: string
  sets: number
  restSeconds: number
  exerciseLogs?: ExerciseLog[]
}

type ExerciseLog = {
  id: string
  exerciseId: string
  completion: string
  performedAt: string
  actualSets?: number
  actualReps?: string
  weightKg?: number
  rpe?: number
  notes?: string
}

type HistoryData = {
  student?: {
    id: string
    firstName: string
    lastName: string
  }
  routines: Session[]
  sessionReports: Session[]
}

export type { Session, Exercise, ExerciseLog, HistoryData }