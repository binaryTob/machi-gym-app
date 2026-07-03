import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/error-handler'
import { requestIdMiddleware } from './middleware/request-id'
import studentRoutes from './routes/students'
import exerciseLogRoutes from './routes/exercise-logs'
import sessionReportRoutes from './routes/session-reports'
import integrationRoutes from './routes/integration'
import { isRedisAvailable, setRedisAvailable } from './config/redis'
import { startRoutineWorker } from './queue/routine.worker'

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(requestIdMiddleware)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}))
app.use(express.json({ limit: '10mb' }))

app.get('/health', async (_req, res) => {
  const { healthCheck } = await import('./services/health.service')
  healthCheck(_req, res)
})

app.get('/health/ready', async (_req, res) => {
  const { readinessCheck } = await import('./services/health.service')
  readinessCheck(_req, res)
})

app.use('/api/students', studentRoutes)
app.use('/api/exercise-logs', exerciseLogRoutes)
app.use('/api/session-reports', sessionReportRoutes)
app.use('/api/integration', integrationRoutes)
app.use(errorHandler)

const server = app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`)

  await startRoutineWorker()
  if (isRedisAvailable()) {
    console.log('[n8n] Redis connected, routine worker started')
  } else {
    console.warn('[n8n] Redis unavailable — routine generation disabled')
  }

  console.log('Gimnasio App - All 6 Phases Initialized Successfully')
})

export { app, server }
