type SessionReport = {
  id: string
  content: string
  createdAt: string
  student?: {
    id: string
    firstName: string
    lastName: string
  }
}

type Routine = {
  id: string
  name: string
  generatedAt: string
  exercises?: Exercise[]
  student?: {
    id: string
    firstName: string
    lastName: string
  }
}

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
  routines: Routine[]
  sessionReports: SessionReport[]
}

export type { Session, Exercise, ExerciseLog, HistoryData, SessionReport, Routine }
