import express from 'express'
import { validateBody, validateParams } = require('../middleware/validate')
import { sessionReportZodSchemas } = require('../schemas/session-report.zod')
const { createSessionReport, getSessionReportsByStudent, deleteSessionReport } = require('../services/session-report.service')

const router = express.Router()

router.post('/', validateBody(sessionReportZodSchemas.CreateSessionReportDTO), async (req, res) => {
  try {
    const sessionReport = await createSessionReport(req.body)
    res.status(201).json(sessionReport)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.get('/student/:studentId', validateParams({ studentId: sessionReportZodSchemas.CreateSessionReportDTO.shape.studentId }), async (req, res) => {
  try {
    const sessionReports = await getSessionReportsByStudent(req.params.studentId)
    res.json(sessionReports)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', validateParams({ id: sessionReportZodSchemas.CreateSessionReportDTO.shape.id }), async (req, res) => {
  try {
    const sessionReport = await deleteSessionReport(req.params.id)
    res.json({ message: 'Session report deleted successfully', sessionReport })
  } catch (error) {
    if (error.message === 'Session report not found') {
      return res.status(404).json({ error: 'Session report not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

module.exports = router