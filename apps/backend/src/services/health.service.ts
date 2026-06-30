import express from 'express'
import { Server } from 'http'
import { PrismaClient } from '@prisma/client'
import redis from 'redis'
import axios from 'axios'
import { setTimeout } from 'timers/promises'

export const prisma = new PrismaClient()
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' })

export class HealthService {
  static async getLiveness() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }

  static async getReadiness() {
    const checks = []

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.push({ database: 'ok' })
    } catch (error) {
      checks.push({ database: 'error', message: error.message })
    }

    // Check Redis
    try {
      await redisClient.ping()
      checks.push({ redis: 'ok' })
    } catch (error) {
      checks.push({ redis: 'error', message: error.message })
    }

    // Check n8n webhook endpoint
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      try {
        const response = await axios.get(n8nUrl.replace('/webhook/gym-routine', '/health') || n8nUrl, { timeout: 5000 })
        checks.push({ n8n: 'ok' })
      } catch (error) {
        checks.push({ n8n: 'error', message: error.message })
      }
    } else {
      checks.push({ n8n: 'not_configured' })
    }

    const allHealthy = checks.every(check => check === 'ok' || check === 'not_configured')

    return {
      healthy: allHealthy,
      checks,
      timestamp: new Date().toISOString(),
      service: 'gym-app-backend'
    }
  }

  static async cleanup() {
    await prisma.$disconnect()
    await redisClient.quit()
  }
}

export const healthCheck = async (req, res) => {
  try {
    const result = await HealthService.getLiveness()
    res.json(result)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export const readinessCheck = async (req, res) => {
  try {
    const result = await HealthService.getReadiness()
    if (!result.healthy) {
      res.status(503).json(result)
    } else {
      res.json(result)
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
