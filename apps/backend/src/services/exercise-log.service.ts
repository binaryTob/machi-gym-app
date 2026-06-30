const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createExerciseLog(data) {
  const { exerciseId, studentId, completion, routineId, ...rest } = data

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { routine: true }
  })

  if (!exercise || exercise.routine.studentId !== studentId) {
    throw new Error('Unauthorized: Exercise does not belong to student')
  }

  const exerciseLog = await prisma.exerciseLog.create({
    data: {
      exerciseId,
      studentId,
      routineId: routineId || exercise.routineId,
      completion,
      actualSets: rest.actualSets,
      actualReps: rest.actualReps,
      weightKg: rest.weightKg,
      rpe: rest.rpe,
      notes: rest.notes,
      performedAt: new Date()
    },
    include: {
      exercise: true,
      routine: {
        include: {
          student: true,
          exercises: true
        }
      },
      student: true
    }
  })

  await updateRoutineStatusIfCompleted(exercise.routineId)

  return exerciseLog
}

async function getExerciseLogById(id, studentId) {
  const exerciseLog = await prisma.exerciseLog.findUnique({
    where: { id },
    include: {
      exercise: true,
      routine: {
        include: {
          student: true,
          exercises: true
        }
      },
      student: true
    }
  })

  if (!exerciseLog || exerciseLog.studentId !== studentId) {
    throw new Error('Unauthorized: Exercise log does not belong to student')
  }

  return exerciseLog
}

async function updateExerciseLog(id, studentId, data) {
  const exerciseLog = await prisma.exerciseLog.findUnique({
    where: { id },
    include: {
      exercise: {
        include: { routine: true }
      },
      student: true
    }
  })

  if (!exerciseLog || exerciseLog.studentId !== studentId) {
    throw new Error('Unauthorized: Cannot update this exercise log')
  }

  const updatedExerciseLog = await prisma.exerciseLog.update({
    where: { id },
    data,
    include: {
      exercise: true,
      routine: true,
      student: true
    }
  })

  await updateRoutineStatusIfCompleted(exerciseLog.exercise.routineId)

  return updatedExerciseLog
}

async function getAllExerciseLogs(studentId, routineId = null) {
  const whereClause = {
    studentId
  }

  if (routineId) {
    whereClause.routineId = routineId
  }

  return await prisma.exerciseLog.findMany({
    where: whereClause,
    include: {
      exercise: true,
      routine: {
        include: {
          student: true,
          exercises: true
        }
      }
    },
    orderBy: {
      performedAt: 'desc'
    }
  })
}

async function deleteExerciseLog(id, studentId) {
  const exerciseLog = await prisma.exerciseLog.findUnique({
    where: { id },
    include: {
      exercise: {
        include: { routine: true }
      },
      student: true
    }
  })

  if (!exerciseLog || exerciseLog.studentId !== studentId) {
    throw new Error('Unauthorized: Cannot delete this exercise log')
  }

  await prisma.exerciseLog.delete({
    where: { id }
  })

  return exerciseLog
}

async function updateRoutineStatusIfCompleted(routineId) {
  const completedExercises = await prisma.exerciseLog.count({
    where: { routineId, completion: { not: null } }
  })

  const totalExercises = await prisma.exercise.count({
    where: { routineId }
  })

  if (completedExercises === totalExercises && totalExercises > 0) {
    await prisma.routine.update({
      where: { id: routineId },
      data: { status: 'COMPLETED' }
    })
  } else if (completedExercises > 0 && totalExercises > 0) {
    await prisma.routine.update({
      where: { id: routineId },
      data: { status: 'IN_PROGRESS' }
    })
  }
}

module.exports = {
  createExerciseLog,
  getExerciseLogById,
  updateExerciseLog,
  getAllExerciseLogs,
  deleteExerciseLog
}
