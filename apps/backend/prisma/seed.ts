#!/usr/bin/env node
// Seed script to generate test data for Phase 6 testing

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with test data...')

  // Create students with varied data
  const students = [
    {
      email: 'student1@gym.com',
      firstName: 'Alex',
      lastName: 'Johnson',
      height: 180,
      age: 25,
      lifestyle: 'activo',
      limitations: null,
      weeklyFrequency: 3,
      windowSize: 6,
    },
    {
      email: 'student2@gym.com',
      firstName: 'Taylor',
      lastName: 'Smith',
      height: 165,
      age: 30,
      lifestyle: 'sedentario',
      limitations: 'rodilla izquierda',
      weeklyFrequency: 5,
      windowSize: 10,
    },
    {
      email: 'student3@gym.com',
      firstName: 'Jordan',
      lastName: 'Lee',
      height: 175,
      age: 28,
      lifestyle: 'muy_activo',
      limitations: null,
      weeklyFrequency: 3,
      windowSize: 6,
    },
    {
      email: 'student4@gym.com',
      firstName: 'Casey',
      lastName: 'Wilson',
      height: 170,
      age: 35,
      lifestyle: 'activo',
      limitations: 'lesiones en el brazo derecho',
      weeklyFrequency: 5,
      windowSize: 10,
    },
    {
      email: 'student5@gym.com',
      firstName: 'Riley',
      lastName: 'Brown',
      height: 185,
      age: 22,
      lifestyle: 'muy_activo',
      limitations: null,
      weeklyFrequency: 3,
      windowSize: 6,
    },
  ]

  console.log('Creating students...')
  const createdStudents = []
  for (const studentData of students) {
    const student = await prisma.student.create({
      data: studentData,
    })
    createdStudents.push(student)
  }

  // Create routines for each student
  console.log('Creating routines...')
  const allRoutines = []
  for (const student of createdStudents) {
    const routineCount = Math.floor(Math.random() * 3) + 1 // 1-3 routines per student
    for (let i = 0; i < routineCount; i++) {
      const routine = await prisma.routine.create({
        data: {
          studentId: student.id,
          name: `Routine ${i + 1}`, // Simple descriptive name
          description: `Generated workout routine for ${student.firstName}`, // Descriptive
        },
      })
      allRoutines.push(routine)
    }
  }

  // Create exercises for each routine
  console.log('Creating exercises...')
  const exerciseTemplates = [
    { name: 'Press banca', sets: 4, reps: '8-12', restSeconds: 90 },
    { name: 'Levantamiento muerto', sets: 3, reps: '10-15', restSeconds: 120 },
    { name: 'Curl de biceps', sets: 4, reps: '12-15', restSeconds: 60 },
    { name: 'Sentadillas', sets: 5, reps: '10-20', restSeconds: 120 },
    { name: 'Press militar', sets: 3, reps: '8-12', restSeconds: 90 },
    { name: 'Dominadas', sets: 3, reps: 'max', restSeconds: 180 },
    { name: 'Planchas', sets: 3, reps: '30-60s', restSeconds: 60 },
    { name: 'Burpees', sets: 5, reps: '5-10', restSeconds: 120 },
  ]

  for (const routine of allRoutines) {
    const exerciseCount = Math.floor(Math.random() * 5) + 3 // 3-7 exercises per routine
    for (let i = 0; i < exerciseCount; i++) {
      const idx = Math.floor(Math.random() * exerciseTemplates.length)
      const template = exerciseTemplates[idx]!
      await prisma.exercise.create({
        data: {
          routineId: routine.id,
          name: template.name,
          sets: template.sets,
          reps: template.reps,
          restSeconds: template.restSeconds,
          order: i + 1,
        },
      })
    }
  }

  // Create exercise logs for completed workouts
  console.log('Creating exercise logs and session reports...')
  const allExercises = await prisma.exercise.findMany()

  // Create 50 exercise logs total (distributed across students)
  for (let i = 0; i < 50; i++) {
    const student = createdStudents[Math.floor(Math.random() * createdStudents.length)]
    const exercise = allExercises[Math.floor(Math.random() * allExercises.length)]
    const routine = await prisma.routine.findFirst({
      where: { id: exercise.routineId },
    })

    if (!routine) continue

    const completionOptions = ['SOBRADO', 'AL_LIMITE', 'CON_DIFICULTAD', 'NO_PUDO_TERMINARLO_BIEN']
    const exerciseLog = await prisma.exerciseLog.create({
      data: {
        exerciseId: exercise.id,
        studentId: student.id,
        completion: completionOptions[Math.floor(Math.random() * completionOptions.length)],
        actualSets: Math.floor(Math.random() * 3) + 1,
        actualReps: `${Math.floor(Math.random() * 10) + 5}-${Math.floor(Math.random() * 10) + 8}`, // Variations like "8-12"
        weightKg: parseFloat((Math.random() * 40 + 20).toFixed(2)), // 20-60kg range
        rpe: Math.floor(Math.random() * 9) + 1,
        notes: Math.random() > 0.5 ? 'Good form maintained' : 'CHEF. Need to improve posture',
        performedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random dates in last 30 days
      },
    })

    // Update routine status based on exercise completions
    if (exerciseLog.completion === 'SOBRADO' || exerciseLog.completion === 'AL_LIMITE') {
      await prisma.routine.update({
        where: { id: routine.id },
        data: { status: 'COMPLETED' },
      })
    } else if (exerciseLog.completion === 'CON_DIFICULTAD') {
      await prisma.routine.update({
        where: { id: routine.id },
        data: { status: 'IN_PROGRESS' },
      })
    }

    // Occasionally create session reports
    if (Math.random() > 0.7) {
      await prisma.sessionReport.create({
        data: {
          studentId: student.id,
          content: `Session report for ${student.firstName} on ${new Date().toLocaleDateString()}. 
            Worked on ${exercise.name} with ${exerciseLog.actualSets} sets. 
            Overall sense of accomplishment: ${exerciseLog.completion}. 
            Need to focus on improving ${exerciseLog.completion === 'CON_DIFICULTAD' ? 'technique' : 'recovery'} for next session.
          `.substring(0, 1000), // Limit to 1000 characters
        },
      })
    }
  }

  // Update windowSize for all students based on their weeklyFrequency
  console.log('Updating windowSize for all students...')
  for (const student of createdStudents) {
    await prisma.student.update({
      where: { id: student.id },
      data: {
        windowSize: student.weeklyFrequency * 2,
      },
    })
  }

  console.log('✅ Seeding completed successfully!')
  console.log(`Created ${createdStudents.length} students, ${allRoutines.length} routines,
  ${await prisma.exercise.count()} exercises, and ${await prisma.exerciseLog.count()} exercise logs.
  Students created: ${createdStudents.map(s => `${s.firstName} ${s.lastName} (${s.email})`).join('\n  ')}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('Error during seeding:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
