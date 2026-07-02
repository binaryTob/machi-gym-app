import { PrismaClient, ExerciseCompletion } from '@prisma/client'

const prisma = new PrismaClient()

function generateId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
}

async function main() {
  console.log('Starting database seed for Phase 6 deployment testing...')

  console.log('Clearing existing data...')
  await prisma.integrationLog.deleteMany()
  await prisma.sessionReport.deleteMany()
  await prisma.exerciseLog.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.routine.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.student.deleteMany()

  console.log('Creating 10 students...')
  const students = []
  for (let i = 0; i < 10; i++) {
    const weeklyFrequency = i % 2 === 0 ? 3 : 5
    const student = await prisma.student.create({
      data: {
        email: `student${i + 1}@gym.com`,
        firstName: `Student${i + 1}`,
        lastName: `Test${i + 1}`,
        height: 175 + (i * 3),
        age: 25 + (i % 10),
        lifestyle: i < 7 ? 'activo' : 'sedentario',
        limitations: i < 5 ? '' : 'hombro lesionado',
        weeklyFrequency: weeklyFrequency,
        windowSize: weeklyFrequency * 2,
        profile: {
          create: {}
        }
      }
    })
    students.push(student)
  }
  console.log(`Created ${students.length} students`)

  console.log('Creating routines for each student...')
  const routines = []
  for (const student of students) {
    for (let week = 1; week <= 3; week++) {
      const routine = await prisma.routine.create({
        data: {
          studentId: student.id,
          name: `Week ${week} Routine - ${student.firstName}'s Training Plan`,
          description: `Weekly workout routine for week ${week} based on ${student.lifestyle} lifestyle`,
          status: 'ACTIVE',
          generatedAt: new Date(),
          exercises: {
            create: [
              { name: 'Press de banca', sets: 3, reps: '8-12', restSeconds: 90, order: 1 },
              { name: 'Sentadilla', sets: 4, reps: '6-10', restSeconds: 120, order: 2 },
              { name: 'Peso muerto', sets: 3, reps: '8-12', restSeconds: 90, order: 3 }
            ]
          }
        }
      })
      routines.push(routine)
    }
  }
  console.log(`Created ${routines.length} routines`)

  console.log('Creating exercise logs...')
  const exerciseLogs = []
  for (const student of students.slice(0, 7)) {
    for (let day = 1; day <= 14; day++) {
      for (const routine of routines.filter(r => r.studentId === student.id).slice(0, 2)) {
        for (const exercise of await prisma.exercise.findMany({ where: { routineId: routine.id } })) {
          const completionTypes = ['SOBRADO', 'AL_LIMITE', 'CON_DIFICULTAD']
          const completion = completionTypes[day % completionTypes.length]

          const log = await prisma.exerciseLog.create({
            data: {
              exerciseId: exercise.id,
              studentId: student.id,
              completion: completion as ExerciseCompletion,
              actualSets: 3,
              actualReps: '10',
              weightKg: 20.0 + Math.random() * 30,
              rpe: 6 + Math.floor(Math.random() * 4),
              notes: `${day === 1 ? 'Botella de agua' : ''} ${day % 3 === 0 ? 'Descanso de un minuto' : ''}`,
              performedAt: new Date(Date.now() - (14 - day) * 24 * 60 * 60 * 1000)
            }
          })
          exerciseLogs.push(log)
        }
      }
    }
  }
  console.log(`Created ${exerciseLogs.length} exercise logs`)

  console.log('Creating session reports...')
  for (const student of students) {
    for (let week = 1; week <= 3; week++) {
      await prisma.sessionReport.create({
        data: {
          studentId: student.id,
          content: `Reporte de sesión semana ${week}:\n\n${student.firstName} ${student.lastName} mostró un progreso excelente durante la semana ${week}.\n\nLogros destacados:\n* Asistencias consistentes a los entrenamientos\n* Mejora en técnica de ejecución\n* Recuperación adecuada entre series\n* Mantuvo un RPE adecuado (6-8)\n\nPróximos objetivos:\n* Incrementar peso en press de banca\n* Mejorar técnica de sentadilla\n* Mantener consistencia en pesas rusas\n\nNotas: ${Math.random() > 0.5 ? 'El estudiante mostró fatiga muscular a finales de semana. ' : ''}Por lo general, buen desempeño.`,
          createdAt: new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000)
        }
      })
    }
  }
  console.log('Created session reports for all students')

  console.log('Creating integration logs...')
  for (const routine of routines.slice(0, 3)) {
    const student = students.find(s => s.id === routine.studentId)
    await prisma.integrationLog.create({
      data: {
        studentId: student!.id,
        routineId: routine.id,
        payload: {
          exercises: [
            { name: 'Press de banca', sets: 3 },
            { name: 'Sentadilla', sets: 4 },
            { name: 'Peso muerto', sets: 3 }
          ],
          metadata: {
            generatedBy: 'n8n',
            version: '1.0',
            timestamp: new Date().toISOString()
          }
        },
        response: {
          status: 'SUCCESS',
          runId: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          executedAt: new Date()
        },
        status: 'SUCCESS',
        errorMessage: null,
        retryCount: 0,
        webhookUrl: 'http://localhost:5678/webhook/gym-routine',
        callbackUrl: 'http://localhost:4000/api/webhooks/n8n/callback',
        startedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    })
  }
  console.log('Created integration logs')

  console.log('Updating routine statuses...')
  for (const routine of routines) {
    const exerciseCount = await prisma.exercise.count({ where: { routineId: routine.id } })
    const logCount = await prisma.exerciseLog.count({ where: { exercise: { routineId: routine.id } } })

    if (logCount >= exerciseCount * 2) {
      await prisma.routine.update({
        where: { id: routine.id },
        data: { status: 'COMPLETED' }
      })
    }
  }

  console.log('Updated routine statuses')
  console.log('\nSEEDING SUMMARY')
  console.log('===========================')
  console.log(`Students created: ${students.length}`)
  console.log(`Routines created: ${routines.length}`)
  console.log(`Exercises created: ${await prisma.exercise.count()}`)
  console.log(`Exercise logs created: ${exerciseLogs.length}`)
  console.log(`Session reports created: ${await prisma.sessionReport.count()}`)
  console.log('Integration logs created: 3')
  console.log('===========================')
  console.log('Database seeded successfully! Phase 6 testing ready.')
}

if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
    .catch(async (error) => {
      console.error('Error during seed:', error)
      await prisma.$disconnect()
      process.exit(1)
    })
}

export { main }
