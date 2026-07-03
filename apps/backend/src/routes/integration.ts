import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validateBody } from '../middleware/validate'
import { routineGenerationService } from '../services/routine-generation.service'
import { integrationLogService } from '../services/integration-log.service'
import { isRedisAvailable, getRedisError } from '../config/redis'

const router = Router()

const generateSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  routineName: z.string().optional(),
})

const callbackSchema = z.object({
  integrationLogId: z.string().min(1),
  routine: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    exercises: z.array(z.object({
      name: z.string().min(1),
      sets: z.number().int().positive(),
      reps: z.string().min(1),
      restSeconds: z.number().int().optional(),
      order: z.number().int().min(0),
    })).min(1),
  }).optional(),
  error: z.string().optional(),
})

router.get('/health', async (_req: Request, res: Response) => {
  res.json({
    redis: isRedisAvailable() ? 'connected' : 'disconnected',
    redisError: getRedisError(),
    n8nWebhook: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/routine',
  })
})

router.post('/routines/generate', validateBody(generateSchema), async (req: Request, res: Response) => {
  try {
    if (!isRedisAvailable()) {
      return res.status(503).json({ error: 'Redis no disponible' })
    }
    const log = await routineGenerationService.triggerGeneration(req.body)
    res.status(202).json(log)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.post('/webhook/callback', validateBody(callbackSchema), async (req: Request, res: Response) => {
  try {
    const result = await routineGenerationService.handleWebhookCallback(req.body)
    res.json(result)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Integration log not found') {
      return res.status(404).json({ error: 'Integration log not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/logs', async (_req: Request, res: Response) => {
  try {
    const logs = await integrationLogService.listAll()
    res.json(logs)
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/logs/:studentId', async (req: Request, res: Response) => {
  try {
    const logs = await integrationLogService.listByStudent(req.params.studentId!)
    res.json(logs)
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message })
  }
})

export default router
