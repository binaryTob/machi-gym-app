const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createStudent(data) {
  const transactionResult = await prisma.$transaction([
    prisma.student.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        height: data.height,
        age: data.age,
        lifestyle: data.lifestyle,
        limitations: data.limitations,
        weeklyFrequency: data.weeklyFrequency,
        windowSize: data.weeklyFrequency * 2,
        profile: {
          create: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        profile: true
      }
    })
  ])

  const createdStudent = transactionResult[0]
  return transformStudentToResponseDTO(createdStudent)
}

async function getAllStudents() {
  const students = await prisma.student.findMany({
    include: {
      profile: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return students.map(transformStudentToResponseDTO)
}

async function getStudentById(id) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      profile: true
    }
  })

  if (!student) {
    throw new Error('Student not found')
  }

  return transformStudentToResponseDTO(student)
}

async function updateStudent(id, data) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { profile: true }
  })

  if (!student) {
    throw new Error('Student not found')
  }

  const updateData = { ...data }
  if (data.weeklyFrequency) {
    updateData.windowSize = data.weeklyFrequency * 2
  }

  const updatedStudent = await prisma.student.update({
    where: { id },
    data: updateData,
    include: {
      profile: true
    }
  })

  return transformStudentToResponseDTO(updatedStudent)
}

async function deleteStudent(id) {
  const student = await prisma.student.findUnique({
    where: { id }
  })

  if (!student) {
    throw new Error('Student not found')
  }

  await prisma.student.delete({
    where: { id }
  })

  return transformStudentToResponseDTO(student)
}

function transformStudentToResponseDTO(student) {
  return {
    id: student.id,
    email: student.email,
    firstName: student.firstName,
    lastName: student.lastName,
    height: student.height,
    age: student.age,
    lifestyle: student.lifestyle,
    limitations: student.limitations,
    weeklyFrequency: student.weeklyFrequency,
    windowSize: student.windowSize,
    profile: student.profile
      ? {
          id: student.profile.id,
          studentId: student.profile.studentId,
          status: student.profile.status
        }
      : undefined,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt
  }
}

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
}