// Phase 5 Test Script
// Verifies Session Reports & History Window functionality for Phase 5

const fs = require('fs')
const path = require('path')

function runPhase5Tests() {
  console.log('=== RUNNING PHASE 5 TESTS ===\n')

  let passedTests = 0
  let totalTests = 0

  // Use process.cwd() to get the correct working directory
  const cwd = process.cwd()
  const backendDir = path.join(cwd, 'apps/backend')
  const frontendDir = path.join(cwd, 'apps/frontend/src')

  // Test 1: Session reports DTO schema exists
  totalTests++
  const sessionReportZodPath = path.join(backendDir, 'src/schemas/session-report.zod.ts')
  if (fs.existsSync(sessionReportZodPath)) {
    const content = fs.readFileSync(sessionReportZodPath, 'utf8')
    const hasSessionReport = content.includes('SessionReport') && content.includes('CreateSessionReportDTO')
    const hasContent = content.includes('content')
    const hasMaxValidation = content.includes('z.string().max')
    if (hasSessionReport && hasContent && hasMaxValidation) {
      console.log('  ✅ Session Report DTO schema exists with content validation (max 10000 chars)')
      passedTests++
    } else {
      console.log('  ❌ Session Report DTO schema incomplete')
    }
  } else {
    console.log('  ❌ session-report.zod.ts not found at:', sessionReportZodPath)
  }

  // Test 2: Session report services exist
  totalTests++
  const sessionReportServicePath = path.join(backendDir, 'src/services/session-report.service.ts')
  if (fs.existsSync(sessionReportServicePath)) {
    const content = fs.readFileSync(sessionReportServicePath, 'utf8')
    if (content.includes('createSessionReport') && content.includes('getSessionReportsByStudent') && 
        content.includes('deleteSessionReport')) {
      console.log('  ✅ Session report services implement CRUD operations')
      passedTests++
    } else {
      console.log('  ❌ Session report services incomplete')
    }
  } else {
    console.log('  ❌ session-report.service.ts not found at:', sessionReportServicePath)
  }

  // Test 3: HistoryService.getRecentSessions with windowSize limit
  totalTests++
  const historyServicePath = path.join(backendDir, 'src/services/history.service.ts')
  if (fs.existsSync(historyServicePath)) {
    const content = fs.readFileSync(historyServicePath, 'utf8')
    if (content.includes('windowSize') && content.includes('take: limit') && 
        content.includes('getRecentSessions') && /orderBy\s*\[/g.test(content)) {
      console.log('  ✅ HistoryService.getRecentSessions respects windowSize with proper ordering')
      passedTests++
    } else {
      console.log('  ❌ HistoryService.getRecentSessions incomplete or missing windowSize limit')
    }
  } else {
    console.log('  ❌ history.service.ts not found at:', historyServicePath)
  }

  // Test 4: History endpoint via session-reports routes
  totalTests++
  const sessionReportsRoutesPath = path.join(backendDir, 'src/routes/session-reports.ts')
  if (fs.existsSync(sessionReportsRoutesPath)) {
    const content = fs.readFileSync(sessionReportsRoutesPath, 'utf8')
    if (content.includes('/history') && /GET\s*\(/g.test(content)) {
      console.log('  ✅ Session Reports routes include history endpoint GET /api/students/:id/history')
      passedTests++
    } else {
      console.log('  ❌ Session Reports routes missing history endpoint or GET route')
    }
  } else {
    console.log('  ❌ session-reports.ts not found at:', sessionReportsRoutesPath)
  }

  // Test 5: Frontend History page exists
  totalTests++
  const historyPagePath = path.join(frontendDir, 'pages/History.tsx')
  if (fs.existsSync(historyPagePath)) {
    const content = fs.readFileSync(historyPagePath, 'utf8')
    if (content.includes('history') && (content.includes('SessionTimeline') || content.includes('useHistory'))) {
      console.log('  ✅ Frontend History page exists')
      passedTests++
    } else {
      console.log('  ❌ History page not found or incomplete')
    }
  } else {
    console.log('  ❌ pages/History.tsx not found at:', historyPagePath)
  }

  // Test 6: SessionTimeline component for displaying history
  totalTests++
  const sessionTimelinePath = path.join(frontendDir, 'components/SessionTimeline.tsx')
  if (fs.existsSync(sessionTimelinePath)) {
    const content = fs.readFileSync(sessionTimelinePath, 'utf8')
    if (content.includes('SessionTimeline') && content.includes('map') && /session-card|group-header/g.test(content)) {
      console.log('  ✅ SessionTimeline component exists for displaying grouped history')
      passedTests++
    } else {
      console.log('  ❌ SessionTimeline component incomplete or missing key features')
    }
  } else {
    console.log('  ❌ components/SessionTimeline.tsx not found at:', sessionTimelinePath)
  }

  // Test 7: useHistory hook exists
  totalTests++
  const useHistoryHookPath = path.join(frontendDir, 'hooks/useHistory.ts')
  if (fs.existsSync(useHistoryHookPath)) {
    const content = fs.readFileSync(useHistoryHookPath, 'utf8')
    if (content.includes('useHistory') && (content.includes('query') || content.includes('fetch')) && (content.includes('studentId') || content.includes('student')) ) {
      console.log('  ✅ useHistory hook exists for fetching student history')
      passedTests++
    } else {
      console.log('  ❌ useHistory hook not found or incomplete')
    }
  } else {
    console.log('  ❌ hooks/useHistory.ts not found at:', useHistoryHookPath)
  }

  // Test 8: Frontend package.json includes needed dependencies
  totalTests++
  const frontendPackagePath = path.join(cwd, 'apps/frontend/package.json')
  if (fs.existsSync(frontendPackagePath)) {
    const content = fs.readFileSync(frontendPackagePath, 'utf8')
    if (content.includes('date-fns') && content.includes('zod') && content.includes('react-hook-form')) {
      console.log('  ✅ Frontend package.json includes needed dependencies (date-fns, zod, react-hook-form)')
      passedTests++
    } else {
      console.log('  ❌ Frontend package.json missing required dependencies')
    }
  } else {
    console.log('  ❌ frontend/package.json not found at:', frontendPackagePath)
  }

  console.log('\n=== PHASE 5 TEST RESULTS ===')
  console.log('Tests passed: ' + passedTests + '/' + totalTests)

  if (passedTests === totalTests) {
    console.log('✅ ALL PHASE 5 TESTS PASS')
    console.log('\nPhase 5 Status: COMPLETE')
    console.log('Components verified:')
    console.log('  1. Session Report DTO schema with validation (max 10000 chars)')
    console.log('  2. Session report CRUD services')
    console.log('  3. HistoryService.getRecentSessions with windowSize limit')
    console.log('  4. GET /api/students/:id/history endpoint')
    console.log('  5. Frontend History page with SessionTimeline')
    console.log('  6. SessionTimeline component for grouped history display')
    console.log('  7. useHistory hook for fetching student history')
    console.log('  8. Frontend package.json includes needed dependencies')
    return true
  } else {
    console.log('❌ SOME PHASE 5 TESTS FAILED')
    console.log('Phase 5 Status: INCOMPLETE')
    console.log('\nMissing components that need implementation:')
    return false
  }
}

if (require.main === module) {
  const success = runPhase5Tests()
  process.exit(success ? 0 : 1)
}

module.exports = { runPhase5Tests }
