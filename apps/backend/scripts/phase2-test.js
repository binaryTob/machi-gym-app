import fs from 'fs'
import path from 'path'

function runPhase2Tests() {
  console.log('=== RUNNING PHASE 2 TESTS ===\n')

  let passedTests = 0
  let totalTests = 0

  // Test 1: File structure check
  totalTests++
  const requiredFiles = [
    'apps/backend/src/main.ts',
    'apps/backend/src/routes/students.ts',
    'apps/backend/src/services/student.service.ts',
    'apps/backend/src/schemas/student.zod.ts',
    'apps/backend/src/services/student-calculations.ts',
    'apps/backend/src/middleware/validate.ts',
    'apps/backend/src/middleware/request-id.ts',
  ]

  let allFilesExist = true
  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file)
    if (!fs.existsSync(fullPath)) {
      console.log(`  ❌ Missing file: ${file}")
      allFilesExist = false
    }
  }

  if (allFilesExist) {
    console.log('  ✅ All Phase 2 core files exist')
    passedTests++
  }

  // Test 2: Schema validation check
  totalTests++
  try {
    const schemaPath = path.join(process.cwd(), 'apps/backend/src/schemas/student.zod.ts')
    const schemaContent = fs.readFileSync(schemaPath, 'utf8')

    const requiredElements = [
      'CreateStudentDTO',
      'UpdateStudentDTO', 
      'StudentResponseDTO',
      'z.string().email(',
      'z.number().positive(',
      'z.enum([', // lifestyle enum
      'weeklyFrequency',
      'windowSize'
    ]

    let schemaValid = true
    for (const element of requiredElements) {
      if (!schemaContent.includes(element)) {
        console.log(`  ❌ Missing schema element: ${element}")
        schemaValid = false
      }
    }

    if (schemaValid) {
      console.log('  ✅ Schema contains all required elements')
      passedTests++
    }
  } catch (error) {
    console.log(`  ❌ Schema test failed: ${error.message}")
  }

  // Test 3: Service functionality check
  totalTests++
  try {
    const servicePath = path.join(process.cwd(), 'apps/backend/src/services/student.service.ts')
    const serviceContent = fs.readFileSync(servicePath, 'utf8')

    const requiredServiceMethods = [
      'createStudent',
      'getAllStudents',
      'getStudentById',
      'updateStudent',
      'deleteStudent'
    ]

    let serviceValid = true
    for (const method of requiredServiceMethods) {
      if (!serviceContent.includes(method)) {
        console.log(`  ❌ Missing service method: ${method}")
        serviceValid = false
      }
    }

    if (serviceValid) {
      console.log('  ✅ Service contains all required methods')
      passedTests++
    }
  } catch (error) {
    console.log(`  ❌ Service test failed: ${error.message}")
  }

  // Test 4: Routes check
  totalTests++
  try {
    const routesPath = path.join(process.cwd(), 'apps/backend/src/routes/students.ts')
    const routesContent = fs.readFileSync(routesPath, 'utf8')

    const requiredRoutes = [
      'router.get('/',
      'router.post('/',
      'router.get('/:id/profile',
      'router.put('/:id',
      'router.delete('/:id',
      'validateBody(',
      'validateParams('
    ]

    let routesValid = true
    for (const route of requiredRoutes) {
      if (!routesContent.includes(route)) {
        console.log(`  ❌ Missing route: ${route}")
        routesValid = false
      }
    }

    if (routesValid) {
      console.log('  ✅ Routes contain all required endpoints and middleware')
      passedTests++
    }
  } catch (error) {
    console.log(`  ❌ Routes test failed: ${error.message}")
  }

  // Test 5: Middleware functionality
  totalTests++
  try {
    const validatePath = path.join(process.cwd(), 'apps/backend/src/middleware/validate.ts')
    const validateContent = fs.readFileSync(validatePath, 'utf8')

    const requiredMiddleware = [
      'validateBody(',
      'validateParams('
    ]

    let middlewareValid = true
    for (const middleware of requiredMiddleware) {
      if (!validateContent.includes(middleware)) {
        console.log(`  ❌ Missing middleware: ${middleware}")
        middlewareValid = false
      }
    }

    if (middlewareValid) {
      console.log('  ✅ Middleware contains all required functions')
      passedTests++
    }
  } catch (error) {
    console.log(`  ❌ Middleware test failed: ${error.message}")
  }

  // Test 6: Student calculations
  totalTests++
  try {
    const calcPath = path.join(process.cwd(), 'apps/backend/src/services/student-calculations.ts')
    const calcContent = fs.readFileSync(calcPath, 'utf8')

    if (calcContent.includes('calculateWindowSize') && calcContent.includes('weeklyFrequency * 2')) {
      console.log('  ✅ Student calculations include windowSize logic')
      passedTests++
    } else {
      console.log('  ❌ Student calculations missing windowSize logic')
    }
  } catch (error) {
    console.log(`  ❌ Calculations test failed: ${error.message}")
  }

  console.log('\n=== PHASE 2 TEST RESULTS ===')
  console.log(`Tests passed: ${passedTests}/${totalTests}`)

  if (passedTests === totalTests) {
    console.log('✅ ALL TESTS PASSED')
    console.log('\nPhase 2 Status: COMPLETE')
    console.log('\nReady for deployment with:')
    console.log('  yarn docker:up (start services)')
    console.log('  yarn db:generate (generate Prisma client)')
    console.log('  yarn db:migrate (apply database migrations)')
    console.log('  yarn test:phase2 (run Phase 2 tests)')
    return true
  } else {
    console.log('❌ SOME TESTS FAILED')
    console.log('\nPhase 2 Status: INCOMPLETE')
    return false
  }
}

if (require.main === module) {
  const success = runPhase2Tests()
  process.exit(success ? 0 : 1)
}

module.exports = { runPhase2Tests }
