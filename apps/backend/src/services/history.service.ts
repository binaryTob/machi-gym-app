import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getRecentSessions(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { windowSize: true }
  })

  if (!student) {
    throw new Error('Student not found')
  }

  const limit = student.windowSize

  const routines = await prisma.routine.findMany({
    where: { studentId },
    select: {
      id: true,
      name: true,
      generatedAt: true,
      exercises: {
        select: {
          id: true,
          name: true,
          reps: true,
          sets: true,
          logs: {
            select: {
              id: true,
              exerciseId: true,
              completion: true,
              performedAt: true
            }
          }
        }
      },
      studentId: true
    },
    orderBy: [{ generatedAt: 'desc' }],
    take: limit
  })

  const sessionReports = await prisma.sessionReport.findMany({
    where: { studentId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      studentId: true
    },
    orderBy: [{ createdAt: 'desc' }],
    take: limit
  })

  const studentInfo = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, firstName: true, lastName: true }
  })

  const history = {
    student: studentInfo,
    routines,
    sessionReports
  }

  return history
}
