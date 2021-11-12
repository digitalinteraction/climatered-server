import fs from 'fs/promises'

import { createTerminus } from '@godaddy/terminus'
import {
  AttendanceRepository,
  CarbonRepository,
  ConferenceRepository,
  createMemoryStore,
  I18nService,
  InterpreterRepository,
  JwtService,
  loadResources,
  PostgresService,
  RegistrationRepository,
  ResourcesMap,
  SemaphoreService,
  S3Service,
} from '@openlab/deconf-api-toolkit'
import Yaml from 'yaml'

import {
  AppContext,
  closeRedisAdapter,
  createDebug,
  createEnv,
  EmailService,
  loadConfig,
  RedisService,
  SocketService,
  UrlService,
} from '../lib/module.js'
import { createServer } from '../server.js'
import { MetricsRepository } from '../metrics/metrics-repository.js'

const debug = createDebug('cr:cmd:serve')

export function pickAStore(redisUrl: string | null) {
  if (redisUrl) {
    debug('Using redis store %o', redisUrl)
    return new RedisService(redisUrl)
  } else {
    debug('Using in-memory store')
    return createMemoryStore()
  }
}

export function loadLocales(resources: ResourcesMap): Record<string, unknown> {
  const locales: Record<string, unknown> = {}

  for (const locale of ['en', 'fr', 'es', 'ar']) {
    const key = `i18n/${locale}.yml`

    debug('Loading res/%s', key)
    const raw = resources.get(key)
    if (!raw) throw new Error(`I18n: "${key}" not found`)

    locales[locale] = Yaml.parse(raw.toString('utf8'))
  }

  return locales
}

export interface ServeCommandOptions {
  port: number
}

export async function serveCommand(options: ServeCommandOptions) {
  debug('start')

  const env = createEnv()
  const config = await loadConfig()
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))
  const resources = await loadResources('res')
  const locales = loadLocales(resources)

  debug('Package name=%o version=%o', pkg.name, pkg.version)
  debug('Loaded resources %o', [...resources.keys()])

  const store = pickAStore(env.REDIS_URL)
  const postgres = new PostgresService({ env })
  const url = new UrlService({ env })
  const email = new EmailService({ env, config })
  const jwt = new JwtService({ env, store })
  const i18n = new I18nService(locales)
  const semaphore = new SemaphoreService({ store })
  const sockets = new SocketService()
  const s3 = new S3Service({ env })

  const attendanceRepo = new AttendanceRepository({ postgres })
  const carbonRepo = new CarbonRepository({ postgres })
  const conferenceRepo = new ConferenceRepository({ store })
  const registrationRepo = new RegistrationRepository({ postgres })
  const metricsRepo = new MetricsRepository({ postgres })
  const interpreterRepo = new InterpreterRepository({ jwt, conferenceRepo })

  const context: AppContext = {
    config,
    env,
    pkg,
    resources,

    email,
    i18n,
    jwt,
    postgres,
    s3,
    semaphore,
    sockets,
    store,
    url,

    attendanceRepo,
    carbonRepo,
    conferenceRepo,
    interpreterRepo,
    metricsRepo,
    registrationRepo,
  }

  debug('Creating server')
  const { server, io } = await createServer(context)
  server.listen(options.port, () => {
    debug('Listening on 0.0.0.0:%d', options.port)
  })

  createTerminus(server, {
    signals: ['SIGINT', 'SIGTERM'],
    healthChecks: {
      '/healthz': async () => {
        await store.checkHealth()
        await postgres.run((c) => c.sql`SELECT 'OK';`)
      },
    },
    beforeShutdown: () => {
      const wait = env.NODE_ENV !== 'development' ? 5000 : 0
      debug('beforeShutdown wait=%dms', wait)
      return new Promise((resolve) => setTimeout(resolve, wait))
    },
    onSignal: async () => {
      debug('onSignal')
      await store.close()
      await postgres.close()
      closeRedisAdapter(io.of('/').adapter)
    },
  })
}
