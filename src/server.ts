import createDebug = require('debug')
import dotenv = require('dotenv')
import morgan = require('morgan')

import { createTerminus } from '@godaddy/terminus'
import { Chowish } from '@robb_j/chowchow'

import { createEnv, Env } from './env'

import { RedisService, createRedisService } from './services/redis'
import { ScheduleService, createScheduleService } from './services/schedule'
import { JwtService, createJwtService } from './services/jwt'
import { UrlService, createUrlService } from './services/url'
import { UsersService, createUsersService } from './services/users'
import { AuthService, createAuthService } from './services/auth'
import { PostgresService, createPostgresService } from './services/postgres'
import { I18nService, createI18nService } from './services/i18n'

import homeRoute from './routes/home'
import meRoute from './routes/auth/me'
import emailRequestRoute from './routes/auth/email-request'
import emailCallbackRoute from './routes/auth/email-callback'
import registerRoute from './routes/auth/register'
import unregisterRoute from './routes/auth/unregister'
import verifyRoute from './routes/auth/verify'

import getSlotsRoute from './routes/schedule/get-slots'
import getSessionsRoute from './routes/schedule/get-sessions'
import getSettingsRoute from './routes/schedule/get-settings'
import getSpeakersRoute from './routes/schedule/get-speakers'
import getThemesRoute from './routes/schedule/get-themes'
import getTypesRoute from './routes/schedule/get-types'
import getTracksRoute from './routes/schedule/get-tracks'
import getIcsRoute from './routes/schedule/get-ics'

import attendRoute from './routes/attendance/attend'
import unattendRoute from './routes/attendance/unattend'
import userAttendanceRoute from './routes/attendance/user-attendance'

import hiSocket from './sockets/hi'
import authSocket from './sockets/auth'
import deauthSocket from './sockets/deauth'

import joinChannelSocket from './sockets/channel/join-channel'
import leaveChannelSocket from './sockets/channel/leave-channel'

import acceptInterpretSocket from './sockets/interpret/accept-interpret'
import joinInterpretSocket from './sockets/interpret/join-interpret'
import leaveInterpretSocket from './sockets/interpret/leave-interpret'
import messageInterpretSocket from './sockets/interpret/message-interpret'
import requestInterpretSocket from './sockets/interpret/request-interpret'
import sendInterpretSocket from './sockets/interpret/send-interpret'
import startInterpretSocket from './sockets/interpret/start-interpret'
import stopInterpretSocket from './sockets/interpret/stop-interpret'

import emailEvent from './events/email'
import logEvent from './events/log'
import putObjectEvent from './events/put-object'

import { SockChowish, SockChow, SockContext } from './sockchow'

export * from './errors'

const debug = createDebug('api:server')

export interface Context extends SockContext<Env> {
  redis: RedisService
  schedule: ScheduleService
  jwt: JwtService
  url: UrlService
  users: UsersService
  auth: AuthService
  pg: PostgresService
  i18n: I18nService
}

export type TypedChow = SockChowish<Env, Context> & Chowish<Env, Context>

export function setupMiddleware(chow: TypedChow) {
  chow.middleware((app) => {
    //
    // Log requests for debugging
    //
    app.use((req, res, next) => {
      if (req.path !== 'req.path') {
        debug(`${req.method}: ${req.path}`)
      }
      next()
    })

    //
    // Optionally enable access logs
    //
    if (chow.env.ENABLE_ACCESS_LOGS) {
      app.use(morgan('tiny'))
    }
  })
}

export function setupEvents(chow: TypedChow) {
  debug('#setupEvents')
  chow.apply(emailEvent, logEvent, putObjectEvent)
}

export function setupRoutes(chow: TypedChow) {
  debug('#setupRoutes')
  chow.apply(
    homeRoute,
    meRoute,
    emailRequestRoute,
    emailCallbackRoute,
    registerRoute,
    unregisterRoute,
    verifyRoute,
    getSlotsRoute,
    getSessionsRoute,
    getSettingsRoute,
    getSpeakersRoute,
    getThemesRoute,
    getTracksRoute,
    getTypesRoute,
    getIcsRoute,
    attendRoute,
    unattendRoute,
    userAttendanceRoute
  )
}

export function setupSockets(chow: TypedChow) {
  debug('#setupSockets')
  chow.apply(
    hiSocket,
    authSocket,
    deauthSocket,

    joinChannelSocket,
    leaveChannelSocket,

    acceptInterpretSocket,
    joinInterpretSocket,
    leaveInterpretSocket,
    messageInterpretSocket,
    requestInterpretSocket,
    sendInterpretSocket,
    startInterpretSocket,
    stopInterpretSocket
  )
}

export async function runServer() {
  debug('#runServer')
  //
  // Load variables from environment variables
  //
  dotenv.config()

  //
  // Create our custom environment
  //
  debug('#runServer creating env')
  const env = createEnv(process.env)

  //
  // Setup services
  //
  debug('#runServer setting up services')
  const redis = createRedisService(env.REDIS_URL)
  const schedule = createScheduleService(redis)
  const jwt = createJwtService(env.JWT_SECRET)
  const url = createUrlService(env.SELF_URL, env.WEB_URL)
  const auth = createAuthService(redis, jwt)
  const pg = createPostgresService(env.SQL_URL)
  const users = createUsersService(pg)
  const i18n = await createI18nService()

  //
  // Create our chow instance
  //
  debug('#runServer creating server')
  const ctxFactory: (ctx: SockContext<Env>) => Context = (base) => ({
    ...base,
    redis,
    schedule,
    jwt,
    url,
    users,
    auth,
    pg,
    i18n,
  })
  const chow = new SockChow(ctxFactory, env)
  chow.addHelpers({
    trustProxy: true,
    jsonBody: true,
    urlEncodedBody: true,
    corsHosts: env.CORS_HOSTS,
  })
  setupMiddleware(chow)
  setupEvents(chow)
  setupRoutes(chow)
  setupSockets(chow)

  //
  // Start our server
  //
  debug('#runServer starting')
  await chow.start({
    port: 3000,
    handle404s: true,
    outputUrl: true,
  })

  //
  // Make sure the server shuts down consistently
  //
  createTerminus(chow.server, {
    healthChecks: {
      '/healthz': async () => {
        await redis.ping()
      },
    },
    signals: ['SIGINT', 'SIGTERM'],
    onSignal: async () => {
      debug('onSignal')
      await redis.quit()
    },
    beforeShutdown: () => {
      debug('beforeShutdown')
      if (env.NODE_ENV === 'development') return Promise.resolve()
      return new Promise((resolve) => setTimeout(resolve, 5000))
    },
  })
}
