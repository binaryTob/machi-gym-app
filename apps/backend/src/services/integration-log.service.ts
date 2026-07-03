import { PrismaClient, Prisma, IntegrationStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface CreateIntegrationLogInput {
  studentId?: string
  routineId?: string
  payload: Record<string, unknown>
  webhookUrl: string
  callbackUrl: string
}

async function create(data: CreateIntegrationLogInput) {
  return prisma.integrationLog.create({
    data: {
      studentId: data.studentId,
      routineId: data.routineId,
      payload: data.payload as Prisma.InputJsonValue,
      webhookUrl: data.webhookUrl,
      callbackUrl: data.callbackUrl,
      status: 'PENDING',
    },
  })
}

async function getById(id: string) {
  const log = await prisma.integrationLog.findUnique({ where: { id } })
  if (!log) throw new Error('Integration log not found')
  return log
}

async function listByStudent(studentId: string) {
  return prisma.integrationLog.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

async function listAll() {
  return prisma.integrationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

async function updateStatus(id: string, status: IntegrationStatus, extra?: {
  response?: Record<string, unknown>
  errorMessage?: string
  retryCount?: number
  completedAt?: Date
}) {
  return prisma.integrationLog.update({
    where: { id },
    data: {
      status,
      response: extra?.response as Prisma.InputJsonValue | undefined,
      errorMessage: extra?.errorMessage ?? undefined,
      retryCount: extra?.retryCount ?? undefined,
      completedAt: extra?.completedAt ?? undefined,
    },
  })
}

async function incrementRetry(id: string) {
  return prisma.integrationLog.update({
    where: { id },
    data: { retryCount: { increment: 1 } },
  })
}

export const integrationLogService = {
  create,
  getById,
  listByStudent,
  listAll,
  updateStatus,
  incrementRetry,
}
