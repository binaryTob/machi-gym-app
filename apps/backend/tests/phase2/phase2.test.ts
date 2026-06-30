import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'

const projectRoot = join(__dirname, '../..')

describe('Phase 2: Student CRUD & Profile', () => {
  test('should pass all Phase 2 verification tests', () => {
    const result = execSync('node apps/backend/scripts/phase2-test.js', {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 60000
    })
    console.log(result)
    expect(result).toContain('✅ ALL VERIFICATIONS PASSED')
  })
})
