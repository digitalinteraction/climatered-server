import Redis = require('ioredis')

export interface RedisService {
  ping(): Promise<string>
  quit(): Promise<'OK'>
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  setAndExpire(key: string, value: string, duration: number): Promise<void>
  del(key: string): Promise<number>
}

export function createRedisService(redisUrl: string): RedisService {
  const redis = new Redis(redisUrl)

  return {
    ping: () => redis.ping(),
    quit: () => redis.quit(),
    get: (k) => redis.get(k),
    set: (k, v) => redis.set(k, v) as any,
    setAndExpire: async (k, v, d) => redis.set(k, v, 'EX', d) as any,
    del: (k) => redis.del(k),
  }
}
