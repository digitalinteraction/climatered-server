import {
  MetricsRepository,
  PostgresService,
  SemaphoreService,
  SITE_VISITORS_ROOM,
} from '@openlab/deconf-api-toolkit'
import { createAdapter as socketIoRedisAdapter } from '@socket.io/redis-adapter'
import ms from 'ms'
import { Server as SocketIoServer } from 'socket.io'
import {
  closeRedisAdapter,
  createDebug,
  createEnv,
  createRedisClient,
  RedisService,
} from '../lib/module.js'

const debug = createDebug('cr:cmd:log-visitors')

const LOG_VISITORS_LOCK_KEY = 'log_visitors_lock'
const LOG_VISITORS_MAX_LOCK = ms('1m')

export interface LogVisitorsCommandOptions {}

export async function logVisitorsCommand(options: LogVisitorsCommandOptions) {
  debug('start')

  // Parse environment variables
  const env = createEnv()
  if (!env.REDIS_URL) throw new Error('REDIS_URL not set')

  // Setup a store and create a semaphore
  const store = new RedisService(env.REDIS_URL)
  const semaphore = new SemaphoreService({ store })

  // Prepare a socket.io server which talks to redis
  const io = new SocketIoServer()
  io.adapter(
    socketIoRedisAdapter(
      createRedisClient(env.REDIS_URL),
      createRedisClient(env.REDIS_URL)
    )
  )

  // Connect to postgres and create a metrics repo to log the metric
  const postgres = new PostgresService({ env })
  const metricsRepo = new MetricsRepository({ postgres })

  // Ensure this process is locked, so only 1 runs at once
  const hasLock = await semaphore.aquire(
    LOG_VISITORS_LOCK_KEY,
    LOG_VISITORS_MAX_LOCK
  )
  if (!hasLock) {
    throw new Error(`Failed to aquire lock "${LOG_VISITORS_LOCK_KEY}"`)
  }
  debug('aquired lock %o', LOG_VISITORS_LOCK_KEY)

  try {
    // Fetch the number of site visitors
    const result = await io.in(SITE_VISITORS_ROOM).fetchSockets()
    debug('visitors %o', result.length)

    // Log the metric
    await metricsRepo.trackEvent('internal/siteVisitors', {
      visitors: result.length,
    })

    debug('done')
  } finally {
    // Unlock the semaphore
    await semaphore.release(LOG_VISITORS_LOCK_KEY)

    // Close live connections
    await store.close()
    await postgres.close()
    closeRedisAdapter(io.of('/').adapter)

    debug('closed')
  }
}
