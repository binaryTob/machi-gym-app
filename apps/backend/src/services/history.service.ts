const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getRecentSessions(studentId) {
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
          exerciseLogs: {
            select: {
              id: true,
              exerciseId: true,
              completion: true,
              performedAt: true
            }
          }
        }
      },
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
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
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: [{ createdAt: 'desc' }],
    take: limit
  })

  const history = {
    student: routines[0]?.student || sessionReports[0]?.student,
    routines,
    sessionReports
  }

  return history
}

module.exports = { getRecentSessions }