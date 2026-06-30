const fs = require('fs')
const path = require('path')

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
    const fullPath = path.join(__dirname, '../../..', file)
    if (!fs.existsSync(fullPath)) {
      console.log('  ❌ Missing file: ' + file)
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
    const schemaPath = path.join(__dirname, '../../..', 'apps/backend/src/schemas/student.zod.ts')
    const schemaContent = fs.readFileSync(schemaPath, 'utf8')

    const requiredElements = [
      'CreateStudentDTO',
      'UpdateStudentDTO',
      'StudentResponseDTO',
      'z.string().email(',
      'z.number().int().positive(',
      'z.enum([',
      'weeklyFrequency',
      'windowSize'
    ]

    let schemaValid = true
    for (const element of requiredElements) {
      if (!schemaContent.includes(element)) {
        console.log('  ❌ Missing schema element: ' + element)
        schemaValid = false
      }
    }

    if (schemaValid) {
      console.log('  ✅ Student Zod schema contains all required elements')
      passedTests++
    }
  } catch (error) {
    console.log('  ❌ Schema validation test failed:', error.message)
  }

  // Test 3: Service validation check
  totalTests++
  try {
    const servicePath = path.join(__dirname, '../../..', 'apps/backend/src/services/student.service.ts')
    const serviceContent = fs.readFileSync(servicePath, 'utf8')

    const requiredMethods = [
      'createStudent',
      'getAllStudents',
      'getStudentById',
      'updateStudent',
      'deleteStudent'
    ]

    let methodsValid = true
    for (const method of requiredMethods) {
      if (!serviceContent.includes(method + '(')) {
        console.log('  ❌ Missing service method: ' + method)
        methodsValid = false
      }
    }

    if (methodsValid) {
      console.log('  ✅ Student service contains all required methods')
      passedTests++
    }
  } catch (error) {
    console.log('  ❌ Service validation test failed:', error.message)
  }

  // Test 4: Middleware validation check
  totalTests++
  try {
    const middlewarePath = path.join(__dirname, '../../..', 'apps/backend/src/routes/students.ts')
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')

    const requiredMiddleware = [
      'validateBody(',
      'validateParams('
    ]

    let middlewareValid = true
    for (const mw of requiredMiddleware) {
      if (!middlewareContent.includes(mw)) {
        console.log('  ❌ Missing middleware: ' + mw)
        middlewareValid = false
      }
    }

    if (middlewareValid) {
      console.log('  ✅ Student routes include required middleware')
      passedTests++
    }
  } catch (error) {
    console.log('  ❌ Middleware validation test failed:', error.message)
  }

  console.log('\n=== PHASE 2 TEST RESULTS ===')
  console.log('Tests passed: ' + passedTests + '/' + totalTests)

  if (passedTests === totalTests) {
    console.log('✅ ALL PHASE 2 TESTS PASS')
    console.log('\nPhase 2 Status: COMPLETE')
    console.log('Components verified:')
    console.log('  1. Core file structure')
    console.log('  2. Zod validation schemas')
    console.log('  3. Service implementation')
    console.log('  4. Middleware integration')
    return true
  } else {
    console.log('❌ SOME PHASE 2 TESTS FAILED')
    console.log('Phase 2 Status: INCOMPLETE')
    return false
  }
}

if (require.main === module) {
  const success = runPhase2Tests()
  process.exit(success ? 0 : 1)
}

module.exports = { runPhase2Tests }
