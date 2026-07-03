const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export function getRedisConfig() {
  const url = new URL(REDIS_URL)
  return {
    host: url.hostname || 'localhost',
    port: parseInt(url.port || '6379', 10),
    maxRetriesPerRequest: null,
    retryStrategy: () => null,
    lazyConnect: true,
  }
}

let redisAvailable = false
let redisError: string | null = null

export function isRedisAvailable(): boolean {
  return redisAvailable
}

export function getRedisError(): string | null {
  return redisError
}

export function setRedisAvailable(available: boolean, error?: string): void {
  redisAvailable = available
  redisError = error ?? null
}
