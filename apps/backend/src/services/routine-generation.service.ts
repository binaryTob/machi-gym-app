import { PrismaClient } from '@prisma/client'
import { integrationLogService } from './integration-log.service'
import { enqueueRoutineGeneration } from '../queue/routine.queue'

const prisma = new PrismaClient()

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/routine'
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || `http://localhost:${process.env.PORT || 4000}`

interface GenerateRoutineInput {
  studentId: string
  routineName?: string
}

async function triggerGeneration(input: GenerateRoutineInput) {
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    include: { profile: true },
  })

  if (!student) throw new Error('Student not found')

  const payload = {
    studentId: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    height: student.height,
    age: student.age,
    lifestyle: student.lifestyle,
    limitations: student.limitations,
    weeklyFrequency: student.weeklyFrequency,
    routineName: input.routineName || `Rutina ${student.firstName}`,
  }

  const callbackUrl = `${CALLBACK_BASE_URL}/api/integration/webhook/callback`

  const log = await integrationLogService.create({
    studentId: student.id,
    payload,
    webhookUrl: N8N_WEBHOOK_URL,
    callbackUrl,
  })

  await enqueueRoutineGeneration({
    integrationLogId: log.id,
    studentId: student.id,
    webhookUrl: N8N_WEBHOOK_URL,
    callbackUrl,
    payload,
  })

  return log
}

async function handleWebhookCallback(body: {
  integrationLogId: string
  routine?: {
    name: string
    description?: string
    exercises: Array<{
      name: string
      sets: number
      reps: string
      restSeconds?: number
      order: number
    }>
  }
  error?: string
}) {
  const log = await integrationLogService.getById(body.integrationLogId)

  if (body.error) {
    await integrationLogService.updateStatus(log.id, 'ERROR', {
      errorMessage: body.error,
      completedAt: new Date(),
    })
    return { success: false, error: body.error }
  }

  if (!body.routine) {
    await integrationLogService.updateStatus(log.id, 'ERROR', {
      errorMessage: 'No routine data in callback',
      completedAt: new Date(),
    })
    return { success: false, error: 'No routine data' }
  }

  const routine = body.routine
  const studentId = log.studentId!

  const created = await prisma.routine.create({
    data: {
      studentId,
      name: routine.name,
      description: routine.description,
      status: 'ACTIVE',
      n8nRunId: log.id,
      exercises: {
        create: routine.exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          restSeconds: ex.restSeconds ?? 90,
          order: ex.order,
        })),
      },
    },
    include: { exercises: { orderBy: { order: 'asc' } } },
  })

  await integrationLogService.updateStatus(log.id, 'SUCCESS', {
    response: { routineId: created.id },
    completedAt: new Date(),
  })

  return { success: true, routine: created }
}

export const routineGenerationService = {
  triggerGeneration,
  handleWebhookCallback,
}
