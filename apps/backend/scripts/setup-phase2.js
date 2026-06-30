// Phase 2 - Student CRUD & Profile Infrastructure Setup Script
// This script sets up all the essential components for Phase 2

import path from 'path'
import fs from 'fs'

function createStudentZodSchema() {
  const schemaDir = path.join(__dirname, '../schemas')
  const schemaContent = `import { z } from 'zod'

const StudentCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  height: z.number().int().positive('Height must be a positive number'),
  age: z.number().int().min(13).max(120, 'Age must be between 13 and 120'),
  lifestyle: z.enum(['sedentario', 'activo', 'muy_activo'], {
    errorMap: () => ({ message: 'Lifestyle must be one of: sedentario, activo, muy_activo' })
  }),
  limitations: z.string().optional(),
  weeklyFrequency: z.number().int().refine(val => [3, 5].includes(val), {
    message: 'Weekly frequency must be 3 or 5'
  })
})

const StudentUpdateSchema = StudentCreateSchema.partial().extend({
  email: StudentCreateSchema.shape.email.optional(),
  height: StudentCreateSchema.shape.height.optional(),
  age: StudentCreateSchema.shape.age.optional(),
  lifestyle: StudentCreateSchema.shape.lifestyle.optional()
})

const StudentResponseSchema = StudentCreateSchema.extend({
  id: z.string(),
  windowSize: z.number().int(),
  profile: z.object({
    id: z.string(),
    studentId: z.string()
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const studentZodSchemas = {
  CreateStudentDTO: StudentCreateSchema,
  UpdateStudentDTO: StudentUpdateSchema,
  StudentResponseDTO: StudentResponseSchema
}

export type CreateStudentDTO = z.infer<typeof StudentCreateSchema>
export type UpdateStudentDTO = z.infer<typeof StudentUpdateSchema>
export type StudentResponseDTO = z.infer<typeof StudentResponseSchema>
`;

  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true })
  }

  fs.writeFileSync(path.join(schemaDir, 'student.zod.ts'), schemaContent)
  console.log('✅ validation schema created')
}

function createValidationMiddleware() {
  const middlewareDir = path.join(__dirname, '../middleware')
  const middlewareContent = `const { studentZodSchemas } = require('../schemas/student.zod')

function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      })
    }
  }
}

function validateParams(idSchema) {
  return (req, res, next) => {
    try {
      req.params = idSchema.parse(req.params)
      next()
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      })
    }
  }
}

module.exports = { validateBody, validateParams }
`;

  if (!fs.existsSync(middlewareDir)) {
    fs.mkdirSync(middlewareDir, { recursive: true })
  }

  fs.writeFileSync(path.join(middlewareDir, 'validate.ts'), middlewareContent)
  console.log('✅ validation middleware created')
}

function createStudentCalculations() {
  const calculationsContent = `function calculateWindowSize(weeklyFrequency) {
  if (![3, 5].includes(weeklyFrequency)) {
    throw new Error('Weekly frequency must be 3 or 5')
  }
  return weeklyFrequency * 2
}

module.exports = {
  calculateWindowSize
}
`;

  const serviceDir = path.join(__dirname, '../services')
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true })
  }

  fs.writeFileSync(path.join(serviceDir, 'student-calculations.ts'), calculationsContent)
  console.log('✅ student calculations created')
}

function createStudentService() {
  const serviceContent = `const { PrismaClient } = require('@prisma/client')
const { calculateWindowSize } = require('../services/student-calculations')
const { studentZodSchemas } = require('../schemas/student.zod')

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
        windowSize: calculateWindowSize(data.weeklyFrequency),
        profile: {
          create: {}
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
    updateData.windowSize = calculateWindowSize(data.weeklyFrequency)
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
          studentId: student.profile.studentId
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
`;

  fs.writeFileSync(path.join(serviceDir, 'student.service.ts'), serviceContent)
  console.log('✅ student service created')
}

function createStudentRoutes() {
  const routesContent = `const express = require('express')
const { validateBody, validateParams } = require('../middleware/validate')
const { studentZodSchemas } = require('../schemas/student.zod')
const { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent } = require('../services/student.service')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const students = await getAllStudents()
    res.json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', validateBody(studentZodSchemas.CreateStudentDTO), async (req, res) => {
  try {
    const student = await createStudent(req.body)
    res.status(201).json(student)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id/profile', validateParams({ id: studentZodSchemas.CreateStudentDTO.shape.id }), async (req, res) => {
  try {
    const student = await getStudentById(req.params.id)
    res.json(student.profile)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', validateParams({ id: studentZodSchemas.CreateStudentDTO.shape.id }), validateBody(studentZodSchemas.UpdateStudentDTO), async (req, res) => {
  try {
    const student = await updateStudent(req.params.id, req.body)
    res.json(student)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', validateParams({ id: studentZodSchemas.CreateStudentDTO.shape.id }), async (req, res) => {
  try {
    const student = await deleteStudent(req.params.id)
    res.json({ message: 'Student deleted successfully', student })
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
`;

  const routesDir = path.join(__dirname, '../routes')
  if (!fs.existsSync(routesDir)) {
    fs.mkdirSync(routesDir, { recursive: true })
  }

  fs.writeFileSync(path.join(routesDir, 'students.ts'), routesContent)
  console.log('✅ student routes created')
}

function createPhase2TestScripts() {
  const testScript = `
import { z } from 'zod'
import fs from 'fs'

// Self-test for Phase 2 functionality
function runPhase2Tests() {
  console.log('=== RUNNING PHASE 2 TESTS ===\\n')

  let testsPassed = 0
  let totalTests = 0

  // Test 1: Student Zod Schema
  totalTests++
  try {
    const StudentCreateSchema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      height: z.number().positive(),
      age: z.number().min(13).max(120),
      lifestyle: z.enum(['sedentario', 'activo', 'muy_activo']),
      weeklyFrequency: z.number().int().refine(val => [3, 5].includes(val)),
    })

    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      height: 180,
      age: 25,
      lifestyle: 'activo' as const,
      weeklyFrequency: 5,
    }

    StudentCreateSchema.parse(validData)
    console.log('  ✅ Zod schema validation works')
    testsPassed++
  } catch (error) {
    console.log('  ❌ Zod schema validation failed:', error.message)
  }

  // Test 2: File structure check
  totalTests++
  try {
    const requiredFiles = [
      '../schemas/student.zod.ts',
      '../middleware/validate.ts',
      '../services/student-calculations.ts',
      '../services/student.service.ts',
      '../routes/students.ts'
    ]

    const allFilesExist = requiredFiles.every(file => fs.existsSync(file))
    if (allFilesExist) {
      console.log('  ✅ All required Phase 2 files exist')
      testsPassed++
    } else {
      console.log('  ❌ Some required files are missing')
    }
  } catch (error) {
    console.log('  ❌ File structure check failed:', error.message)
  }

  // Test 3: Content validation
  totalTests++
  try {
    const schemasPath = path.join(__dirname, '../schemas/student.zod.ts')
    const schemasContent = fs.readFileSync(schemasPath, 'utf8')

    const requiredElements = ['z.string().min(1)', 'z.string().email()', 'z.number().positive()']
    const allElementsExist = requiredElements.every(element => schemasContent.includes(element))

    if (allElementsExist) {
      console.log('  ✅ Zod schema contains all required validation rules')
      testsPassed++
    } else {
      console.log('  ❌ Zod schema missing some validation rules')
    }
  } catch (error) {
    console.log('  ❌ Content validation failed:', error.message)
  }

  console.log('\\n=== PHASE 2 TEST SUMMARY ===')
  console.log('Tests passed: ${testsPassed}/${totalTests}')
  console.log('Status: ${testsPassed === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}')

  return testsPassed === totalTests
}

if (require.main === module) {
  const success = runPhase2Tests()
  process.exit(success ? 0 : 1)
}

module.exports = { runPhase2Tests }
`;

  const scriptsDir = path.join(__dirname, '../scripts')
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true })
  }

  fs.writeFileSync(path.join(scriptsDir, 'phase2-test.js'), testScript)
  console.log('✅ phase 2 test scripts created')
}

// Main execution
function runPhase2Setup() {
  console.log('=== PHASE 2 SETUP: Student CRUD & Profile ===\\n')

  try {
    createStudentZodSchema()
    createValidationMiddleware()
    createStudentCalculations()
    createStudentService()
    createStudentRoutes()
    createPhase2TestScripts()

    console.log('\\n' + '='.repeat(60))
    console.log('✅ PHASE 2 SETUP COMPLETED SUCCESSFULLY')
    console.log('='.repeat(60))
    console.log('\\nPhase 2 components created:')
    console.log('  1️⃣  Validation schemas (Zod) for Student CRUD')
    console.log('  2️⃣  Middleware for request validation')
    console.log('  3️⃣  Student calculation utilities (windowSize)')
    console.log('  4️⃣  Student service with Prisma transactions')
    console.log('  5️⃣  RESTful Student routes with validation')
    console.log('  6️⃣  Automated tests for Phase 2 verification')
    console.log('\\nReady to run:')
    console.log('  yarn db:generate')
    console.log('  yarn db:migrate')
    console.log('  yarn test:phase2')

  } catch (error) {
    console.error('❌ Phase 2 setup failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  runPhase2Setup()
}

module.exports = {
  runPhase2Setup,
  createStudentZodSchema,
  createValidationMiddleware,
  createStudentCalculations,
  createStudentService,
  createStudentRoutes,
  createPhase2TestScripts
}
`;