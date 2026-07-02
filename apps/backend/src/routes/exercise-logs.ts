import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validateBody, validateParams } from '../middleware/validate'
import { ExerciseCompletion } from '../schemas/exercise-log.zod'
import { createExerciseLog, getExerciseLogById, updateExerciseLog, getAllExerciseLogs, deleteExerciseLog } from '../services/exercise-log.service'

const router = Router()
const idParamSchema = z.object({ id: z.string() })

router.post('/', validateBody(ExerciseCompletion), async (req: Request, res: Response) => {
  try {
    const exerciseLog = await createExerciseLog(req.body)
    res.status(201).json(exerciseLog)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  try {
    const exerciseLog = await getExerciseLogById(req.params.id!, req.body.studentId)
    res.json(exerciseLog)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message })
    }
    if (err.message === 'Exercise log not found') {
      return res.status(404).json({ error: err.message })
    }
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  try {
    const exerciseLog = await updateExerciseLog(req.params.id!, req.body.studentId, req.body)
    res.json(exerciseLog)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message })
    }
    if (err.message === 'Exercise log not found') {
      return res.status(404).json({ error: err.message })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const { studentId, routineId } = req.query as { studentId?: string; routineId?: string }
    const exerciseLogs = await getAllExerciseLogs(studentId!, routineId)
    res.json(exerciseLogs)
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.delete('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  try {
    const exerciseLog = await deleteExerciseLog(req.params.id!, req.body.studentId)
    res.json({ message: 'Exercise log deleted successfully', exerciseLog })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message })
    }
    if (err.message === 'Exercise log not found') {
      return res.status(404).json({ error: err.message })
    }
    res.status(500).json({ error: err.message })
  }
})

export default router
