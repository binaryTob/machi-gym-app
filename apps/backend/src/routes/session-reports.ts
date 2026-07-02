import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validateBody, validateParams } from '../middleware/validate'
import { sessionReportZodSchemas } from '../schemas/session-report.zod'
import { createSessionReport, getSessionReportsByStudent, deleteSessionReport } from '../services/session-report.service'
import { getRecentSessions } from '../services/history.service'

const router = Router()
const idParamSchema = z.object({ id: z.string() })
const studentIdParamSchema = z.object({ studentId: z.string() })

router.post('/', validateBody(sessionReportZodSchemas.CreateSessionReportDTO), async (req: Request, res: Response) => {
  try {
    const sessionReport = await createSessionReport(req.body)
    res.status(201).json(sessionReport)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/student/:studentId', validateParams(studentIdParamSchema), async (req: Request, res: Response) => {
  try {
    const sessionReports = await getSessionReportsByStudent(req.params.studentId!)
    res.json(sessionReports)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  try {
    const sessionReport = await deleteSessionReport(req.params.id!)
    res.json({ message: 'Session report deleted successfully', sessionReport })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Session report not found') {
      return res.status(404).json({ error: 'Session report not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/students/:id/history', validateParams(idParamSchema), async (req: Request, res: Response) => {
  try {
    const history = await getRecentSessions(req.params.id!)
    res.json(history)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

export default router
