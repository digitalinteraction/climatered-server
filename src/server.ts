import http from 'http'

import Koa from 'koa'
import KoaRouter from '@koa/router'
import koaCors from '@koa/cors'
import koaJson from 'koa-json'
import koaBodyParser from 'koa-bodyparser'
import koaHelment from 'koa-helmet'

import { Server as SocketIoServer, Socket } from 'socket.io'
import { createAdapter as socketIoRedisAdapter } from '@socket.io/redis-adapter'

import ms from 'ms'
import createDebug from 'debug'

import {
  ApiError,
  SocketService,
  StructApiError,
} from '@openlab/deconf-api-toolkit'
import {
  AppContext,
  AppRouter,
  AppBroker,
  createRedisClient,
} from './lib/module.js'
import { AttendanceRouter } from './deconf/attendance-router.js'
import { CarbonRouter } from './deconf/carbon-router.js'
import { ConferenceRouter } from './deconf/conference-router.js'
import { RegistrationRouter } from './deconf/registration-router.js'
import { AuthBroker } from './deconf/auth-broker.js'
import { ChannelBroker } from './deconf/channel-broker.js'
import { InterpreterBroker } from './deconf/interpreter-broker.js'
import { MetricsBroker } from './deconf/metrics-broker.js'
import { ContentRouter } from './content/content-router.js'
import { GeneralRouter } from './general/general-router.js'
import { MetricsRouter } from './metrics/metrics-router.js'

const debug = createDebug('cr:server')

/** A middleware to output requests when in debug mode */
function debugMiddleware(): Koa.Middleware {
  return async (ctx, next) => {
    const start = Date.now()
    await next()

    // Check for invalid ctx.body use
    if (ctx.body instanceof Promise) {
      console.error('A promise was set on ctx.body')
      console.error(
        'Request: %s %i %s',
        ctx.request.method,
        ctx.response.status,
        ctx.request.path
      )
      process.exit(1)
    }

    const dt = Date.now() - start
    debug(
      '%s %i %s %s',
      ctx.request.method,
      ctx.response.status,
      ctx.request.path,
      ms(dt)
    )
  }
}

function httpErrorHandler(isProduction: boolean): Koa.Middleware {
  return async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      if (error instanceof ApiError) {
        ctx.status = error.status
        ctx.body = {
          error: error.message,
          codes: error.codes,
          stack: error.stack,
        }
        if (error instanceof StructApiError) {
          ctx.body.failures = error.failures
        }
      } else if (error instanceof Error) {
        ctx.status = 500
        ctx.body = {
          error: isProduction ? 'Something went wrong' : error.message,
          stack: isProduction ? null : error.stack,
        }
      } else {
        console.error('A non-Error was thrown')
        console.error(error)
        process.exit(1)
      }
    }
  }
}

export function ioErrorHandler<T extends unknown[]>(
  socket: Socket,
  service: SocketService
) {
  return (endpoint: (...args: T) => Promise<void>) => {
    return async (...args: T) => {
      try {
        await endpoint(...args)
      } catch (error) {
        if (error instanceof ApiError) {
          service.sendError(socket.id, error)
        } else {
          console.error('An unknown error occured')
          console.error(error)
          process.exit(1)
        }
      }
    }
  }
}

export async function createServer(context: AppContext) {
  const router = new KoaRouter()

  const routers: AppRouter[] = [
    new GeneralRouter(context),
    new AttendanceRouter(context),
    new CarbonRouter(context),
    new ConferenceRouter(context),
    new RegistrationRouter(context),
    new ContentRouter(context),
    new MetricsRouter(context),
  ]

  const appBrokers: AppBroker[] = [
    new AuthBroker(context),
    new ChannelBroker(context),
    new InterpreterBroker(context),
    new MetricsBroker(context),
  ]

  for (const appRouter of routers) {
    appRouter.apply(router)
  }

  const app = new Koa()
    .use(koaHelment())
    .use(koaCors({ origin: context.env.CLIENT_URL }))
    .use(koaJson())
    .use(koaBodyParser())
    .use(debugMiddleware())
    .use(httpErrorHandler(context.env.NODE_ENV === 'production'))
    .use(router.routes())
    .use(router.allowedMethods())

  const server = http.createServer(app.callback())
  const io = new SocketIoServer(server, {})
  context.sockets.setIo(io)

  io.on('connection', (socket) => {
    const m = ioErrorHandler(socket, context.sockets)
    appBrokers.forEach((b) => b.socketConnected(socket, m))

    socket.on('disconnect', () => {
      // TODO: potential uncaught promises here
      appBrokers.forEach((b) => b.socketDisconnected(socket))
    })
  })

  if (context.env.REDIS_URL) {
    const pub = createRedisClient(context.env.REDIS_URL)
    const sub = createRedisClient(context.env.REDIS_URL)
    io.adapter(socketIoRedisAdapter(pub, sub))
  }

  return { app, server, router, io }
}
