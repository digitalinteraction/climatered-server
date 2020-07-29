import Redis = require('ioredis')

/**
 * A service for interacting with a redis instance
 */
export interface RedisService {
  ping(): Promise<string>
  quit(): Promise<'OK'>
  get(key: string): Promise<string | null>
  getJson<T>(key: string, fallback: T): Promise<T>
  set(key: string, value: string): Promise<void>
  setAndExpire(key: string, value: string, duration: number): Promise<void>
  del(key: string): Promise<number>
}

export function createRedisService(redisUrl: string): RedisService {
  const redis = new Redis(redisUrl)

  return {
    ping: () => {
      if (redis.status !== 'ready') throw new Error('Not connected')
      return redis.ping()
    },
    quit: () => redis.quit(),
    get: (k) => redis.get(k),
    getJson: async (key, fallback) => {
      return redis
        .get(key)
        .then((text) => (text ? JSON.parse(text) : fallback))
        .catch(() => fallback)
    },
    set: (k, v) => redis.set(k, v) as any,
    setAndExpire: async (k, v, d) => redis.set(k, v, 'EX', d) as any,
    del: (k) => redis.del(k),
  }
}
