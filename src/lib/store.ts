import { createMemoryStore, KeyValueService } from '@openlab/deconf-api-toolkit'
import { EnvRecord } from './env'

export class RedisService implements KeyValueService {
  #redisUrl: string
  constructor(redisUrl: string) {
    this.#redisUrl = redisUrl
  }

  retrieve<T>(key: string): Promise<T | null> {
    throw new Error('Method not implemented.')
  }
  put<T>(key: string, value: T): Promise<void> {
    throw new Error('Method not implemented.')
  }
  checkHealth(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  setExpiry(key: string, duractionInSeconds: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  delete(key: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  close(): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

export function pickAStore(env: EnvRecord) {
  if (env.REDIS_URL) {
    return new RedisService(env.REDIS_URL)
  } else {
    return createMemoryStore()
  }
}
