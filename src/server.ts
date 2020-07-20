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

import homeRoute from './routes/home'
import emailRequestRoute from './routes/auth/email-request'
import emailCallbackRoute from './routes/auth/email-callback'
import getSlotsRoute from './routes/schedule/get-slots'
import getEventsRoute from './routes/schedule/get-events'

import authSocket from './sockets/auth'
import joinChannelSocket from './sockets/audio/join-channel'
import leaveChannelSocket from './sockets/audio/leave-channel'
import sendToChannelSocket from './sockets/audio/send-to-channel'
import startChannelSocket from './sockets/audio/start-channel'
import stopChannelSocket from './sockets/audio/stop-channel'

import emailEvent from './events/email'
import { SockChowish, SockChow, SockContext } from './sockchow'

const debug = createDebug('api:server')

export interface Context extends SockContext<Env> {
  redis: RedisService
  schedule: ScheduleService
  jwt: JwtService
  url: UrlService
  users: UsersService
}

export type TypedChow = SockChowish<Env, Context> & Chowish<Env, Context>

export function setupMiddleware(chow: TypedChow) {
  chow.middleware((app) => {
    //
    // Log requests for debugging
    //
    app.use((req, res, next) => {
      debug(`${req.method}: ${req.path}`)
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
  chow.apply(emailEvent)
}

export function setupRoutes(chow: TypedChow) {
  debug('#setupRoutes')
  chow.apply(
    homeRoute,
    emailRequestRoute,
    emailCallbackRoute,
    getSlotsRoute,
    getEventsRoute
  )
}

export function setupSockets(chow: TypedChow) {
  debug('#setupSockets')
  chow.apply(
    authSocket,
    joinChannelSocket,
    leaveChannelSocket,
    sendToChannelSocket,
    startChannelSocket,
    stopChannelSocket
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
  const schedule = createScheduleService()
  const jwt = createJwtService(env.JWT_SECRET)
  const url = createUrlService(env.SELF_URL, env.WEB_URL)
  const users = createUsersService()

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
  })
  const chow = new SockChow(ctxFactory, env)
  setupEvents(chow)
  setupRoutes(chow)
  setupSockets(chow)

  //
  // Start our server
  //
  debug('#runServer starting')
  await chow.start({
    port: 3000,
    trustProxy: true,
    jsonBody: true,
    urlEncodedBody: true,
    corsHosts: env.CORS_HOSTS,
    handle404s: true,
    outputUrl: true,
  })

  //
  // Make sure the server shuts down consistently
  //
  createTerminus(chow.server, {
    healthChecks: {
      '/healthz': async () => {
        debug('GET /healthz')
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
