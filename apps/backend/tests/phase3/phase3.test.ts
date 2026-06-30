import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'

const projectRoot = join(__dirname, '../..')

describe('Phase 3: Rutinas & n8n Integration Verification', () => {
  test('should execute Phase 3 setup script successfully', () => {
    const setupScript = join(projectRoot, 'apps/backend/scripts/setup-phase3.js')
    if (!existsSync(setupScript)) {
      throw new Error('setup-phase3.js not found')
    }
    
    const result = execSync('node apps/backend/scripts/setup-phase3.js', {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 120000
    })
    console.log('Phase 3 setup completed successfully')
    expect(result).toContain('✅ FASE 3: TODOS LOS COMPONENTES GENERADOS')
  })

  test('should verify Phase 3 file structure', () => {
    const phase3Files = [
      'apps/backend/src/routes/routines.ts',
      'apps/backend/src/services/routine.service.ts',
      'apps/backend/src/queues/routine.queue.ts',
      'apps/backend/src/workers/routine.worker.ts',
      'apps/backend/src/webhooks/n8n.callback.ts',
      'apps/backend/src/services/integration-log.service.ts',
      'apps/frontend/src/hooks/useRoutines.ts',
      'apps/frontend/src/pages/RoutineGenerator.tsx',
      'tests/phase3/*'
    ]

    phase3Files.forEach(filePattern => {
      if (filePattern.includes('/*')) {
        const globPath = filePattern.replace('/*', '/*.ts')
        const fullPath = join(projectRoot, globPath)
        const files = fullPath.split(path.sep).filter(f => f.includes('*'))
      } else {
        const fullPath = join(projectRoot, filePattern)
        if (!existsSync(fullPath)) {
          throw new Error(`Required Phase 3 file not found: ${filePattern}")
        }
      }
    })
  })
})
