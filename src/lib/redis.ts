import { RedisAdapter } from '@socket.io/redis-adapter'
import redis from 'redis'

// https://stackoverflow.com/questions/61875554/ssl-connections-to-redis-instance-for-socket-io-adapter
export function createRedisClient(redisUrl: string) {
  const options: redis.ClientOpts = {
    url: redisUrl,
  }

  if (redisUrl.startsWith('rediss://')) {
    options.tls = { servername: new URL(redisUrl).hostname }
  }

  return redis.createClient(options)
}

export function closeRedisAdapter(adapter: unknown) {
  if (adapter instanceof RedisAdapter) {
    const { pubClient, subClient } = adapter
    pubClient.quit()
    subClient.quit()
  }
}
