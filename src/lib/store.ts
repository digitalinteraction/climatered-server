import { RedisClient } from 'redis'
import { createMemoryStore, KeyValueService } from '@openlab/deconf-api-toolkit'
import { EnvRecord } from './env'
import { createRedisClient } from './redis'
import { promisify } from 'util'

function promisifyRedis(client: RedisClient) {
  const get = promisify(client.get).bind(client)
  const set = promisify(client.set).bind(client)
  const expire = promisify(client.expire).bind(client)
  const ping = promisify(client.ping).bind(client) as () => Promise<string>
  const close = promisify(client.quit).bind(client)
  const del = promisify(client.del).bind(client) as (
    k: string
  ) => Promise<number>

  return { get, set, expire, ping, del, close }
}

type PromisifiedRedis = ReturnType<typeof promisifyRedis>

export class RedisService implements KeyValueService {
  #client: PromisifiedRedis
  constructor(redisUrl: string) {
    this.#client = promisifyRedis(createRedisClient(redisUrl))
  }

  async retrieve<T>(key: string) {
    const result = await this.#client.get(key)
    if (!result) return null
    return JSON.parse(result)
  }

  async put<T>(key: string, value: T) {
    await this.#client.set(key, JSON.stringify(value))
  }

  async checkHealth() {
    const pong = await this.#client.ping()
    if (pong !== 'PONG') throw new Error('Redis disconnected')
  }

  async setExpiry(key: string, duractionInSeconds: number) {
    await this.#client.expire(key, duractionInSeconds)
  }

  async delete(key: string) {
    await this.#client.del(key)
  }

  async close() {
    await this.#client.close()
  }
}

export function pickAStore(env: EnvRecord) {
  if (env.REDIS_URL) {
    return new RedisService(env.REDIS_URL)
  } else {
    return createMemoryStore()
  }
}
