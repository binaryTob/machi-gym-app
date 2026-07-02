import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSessionReport(data: any) {
  const student = await prisma.student.findUnique({
    where: { id: data.studentId }
  })

  if (!student) {
    throw new Error('Student not found')
  }

  return await prisma.sessionReport.create({
    data: {
      studentId: data.studentId,
      content: data.content,
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  })
}

async function getSessionReportsByStudent(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  })

  if (!student) {
    throw new Error('Student not found')
  }

  return await prisma.sessionReport.findMany({
    where: { studentId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function deleteSessionReport(id: string) {
  const sessionReport = await prisma.sessionReport.findUnique({
    where: { id }
  })

  if (!sessionReport) {
    throw new Error('Session report not found')
  }

  await prisma.sessionReport.delete({
    where: { id }
  })

  return sessionReport
}

export {
  createSessionReport,
  getSessionReportsByStudent,
  deleteSessionReport
}
