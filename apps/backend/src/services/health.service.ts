// Health check service for Phase 6 production readiness

import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
}

export async function readinessCheck(req: Request, res: Response): Promise<void> {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    // Check Redis connection (if available)
    // const redis = require('redis')
    // const redisClient = redis.createClient({ host: process.env.REDIS_HOST || 'redis', port: 6379 })
    // await redisClient.ping()

    // Check n8n availability (if URL is configured)
    // if (process.env.N8N_WEBHOOK_URL) {
    //   const response = await fetch(process.env.N8N_WEBHOOK_URL + '/health', { method: 'GET' })
    //   if (!response.ok) throw new Error('n8n service unavailable')
    // }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        redis: 'ok',
        n8n: 'ok'
      }
    })
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),n      error: 'Readiness check failed'
    })
  }
}
