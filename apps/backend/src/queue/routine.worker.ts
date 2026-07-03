import { Worker } from 'bullmq'
import { getRedisConfig, setRedisAvailable, getRedisError } from '../config/redis'
import { integrationLogService } from '../services/integration-log.service'
import type { RoutineJobData } from './routine.queue'
import IORedis from 'ioredis'

const ROUTINE_QUEUE_NAME = 'routine-generation'

let worker: Worker | null = null

export async function startRoutineWorker(): Promise<void> {
  if (worker) return

  const config = getRedisConfig()
  let testRedis: IORedis | null = null

  try {
    testRedis = new IORedis(config)
    await testRedis.ping()
    setRedisAvailable(true)
    console.log('[redis] connected')
  } catch (err) {
    const msg = (err as Error).message
    setRedisAvailable(false, msg)
    console.warn('[redis] could not connect:', msg)
    testRedis?.disconnect()
    return
  }

  worker = new Worker<RoutineJobData>(
    ROUTINE_QUEUE_NAME,
    async (job) => {
      const { integrationLogId, webhookUrl, payload, callbackUrl } = job.data

      await integrationLogService.updateStatus(integrationLogId, 'PROCESSING', {
        retryCount: job.attemptsMade,
      })

      const body = {
        ...payload,
        callbackUrl,
        integrationLogId,
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`n8n webhook returned ${response.status}: ${text}`)
      }

      const responseData = await response.json()

      await integrationLogService.updateStatus(integrationLogId, 'SUCCESS', {
        response: responseData,
        completedAt: new Date(),
      })
    },
    {
      connection: config,
      concurrency: 5,
      lockDuration: 60000,
    }
  )

  worker.on('failed', async (job, err) => {
    if (!job) return
    const { integrationLogId } = job.data
    const attempts = job.attemptsMade

    await integrationLogService.updateStatus(integrationLogId, 'ERROR', {
      errorMessage: err.message,
      retryCount: attempts,
    })
  })

  worker.on('completed', (job) => {
    console.log(`[worker] routine ${job.id} completed`)
  })

  console.log('[worker] routine-generation worker started')
}

export function stopRoutineWorker(): void {
  if (worker) {
    worker.close()
    worker = null
    console.log('[worker] routine-generation worker stopped')
  }
}
