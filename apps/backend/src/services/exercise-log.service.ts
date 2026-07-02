import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createExerciseLog(data: any) {
  const { exerciseId, studentId, completion, ...rest } = data

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
      completion,
      actualSets: rest.actualSets,
      actualReps: rest.actualReps,
      weightKg: rest.weightKg,
      rpe: rest.rpe,
      notes: rest.notes,
      performedAt: new Date()
    },
    include: {
      exercise: {
        include: {
          routine: true
        }
      },
      student: true
    }
  })

  await updateRoutineStatusIfCompleted(exercise.routineId)

  return exerciseLog
}

async function getExerciseLogById(id: string, studentId: string) {
  const exerciseLog = await prisma.exerciseLog.findUnique({
    where: { id },
    include: {
      exercise: {
        include: {
          routine: true
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

async function updateExerciseLog(id: string, studentId: string, data: any) {
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
      exercise: {
        include: {
          routine: true
        }
      },
      student: true
    }
  })

  await updateRoutineStatusIfCompleted(exerciseLog.exercise.routineId)

  return updatedExerciseLog
}

async function getAllExerciseLogs(studentId: string, routineId: string | null = null) {
  const whereClause: any = {
    studentId
  }

  if (routineId) {
    whereClause.exercise = { routineId }
  }

  return await prisma.exerciseLog.findMany({
    where: whereClause,
    include: {
      exercise: {
        include: {
          routine: true
        }
      }
    },
    orderBy: {
      performedAt: 'desc'
    }
  })
}

async function deleteExerciseLog(id: string, studentId: string) {
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

async function updateRoutineStatusIfCompleted(routineId: string) {
  const totalExercises = await prisma.exercise.count({
    where: { routineId }
  })

  const exercises = await prisma.exercise.findMany({
    where: { routineId },
    select: { id: true }
  })

  const completedExercises = await prisma.exerciseLog.count({
    where: {
      exerciseId: { in: exercises.map(e => e.id) }
    }
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

export {
  createExerciseLog,
  getExerciseLogById,
  updateExerciseLog,
  getAllExerciseLogs,
  deleteExerciseLog
}
