import { Queue } from 'bullmq'
import { getRedisConfig } from '../config/redis'

const ROUTINE_QUEUE_NAME = 'routine-generation'

let queue: Queue | null = null

export function getRoutineQueue(): Queue {
  if (!queue) {
    queue = new Queue(ROUTINE_QUEUE_NAME, {
      connection: getRedisConfig(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    })
  }
  return queue
}

export interface RoutineJobData {
  integrationLogId: string
  studentId: string
  webhookUrl: string
  callbackUrl: string
  payload: Record<string, unknown>
}

export async function enqueueRoutineGeneration(data: RoutineJobData): Promise<string> {
  const q = getRoutineQueue()
  const job = await q.add('generate-routine', data, {
    jobId: `routine-${data.integrationLogId}`,
  })
  return job.id!
}
