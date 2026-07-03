export interface IntegrationHealth {
  redis: 'connected' | 'disconnected'
  redisError: string | null
  n8nWebhook: string
}

export interface IntegrationLog {
  id: string
  studentId: string | null
  routineId: string | null
  payload: Record<string, unknown>
  response: Record<string, unknown> | null
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  errorMessage: string | null
  retryCount: number
  webhookUrl: string
  callbackUrl: string
  startedAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface GenerateResponse {
  id: string
  status: string
  studentId: string | null
}

const BASE = '/api/integration'

export async function fetchHealth(): Promise<IntegrationHealth> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Failed to fetch integration health')
  return res.json()
}

export async function fetchLogs(): Promise<IntegrationLog[]> {
  const res = await fetch(`${BASE}/logs`)
  if (!res.ok) throw new Error('Failed to fetch logs')
  return res.json()
}

export async function fetchStudentLogs(studentId: string): Promise<IntegrationLog[]> {
  const res = await fetch(`${BASE}/logs/${studentId}`)
  if (!res.ok) throw new Error('Failed to fetch student logs')
  return res.json()
}

export async function triggerRoutineGeneration(studentId: string, routineName?: string): Promise<GenerateResponse> {
  const res = await fetch(`${BASE}/routines/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, routineName }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to trigger routine generation')
  }
  return res.json()
}
