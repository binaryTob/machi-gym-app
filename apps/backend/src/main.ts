import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/error-handler'
import { requestIdMiddleware } from './middleware/request-id'
import studentRoutes from './routes/students'
import routineRoutes from './routes/routines'
import exerciseLogRoutes from './routes/exercise-logs'
import sessionReportRoutes from './routes/session-reports'

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(requestIdMiddleware)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}))
app.use(express.json({ limit: '10mb' }))

app.get('/health', async (req, res) => {
  const { healthCheck } = await import('./services/health.service')
  healthCheck(req, res)
})

app.get('/health/ready', async (req, res) => {
  const { readinessCheck } = await import('./services/health.service')
  readinessCheck(req, res)
})

app.use('/api/students', studentRoutes)
app.use('/api/routines', routineRoutes)
app.use('/api/exercise-logs', exerciseLogRoutes)
app.use('/api/session-reports', sessionReportRoutes)
app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
  console.log(`Gimnasio App - All 6 Phases Initialized Successfully`)  
})

module.exports = { app, server }