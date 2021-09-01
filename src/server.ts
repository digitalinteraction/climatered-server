import http from 'http'

import Koa from 'koa'
import KoaRouter from '@koa/router'
import koaCors from '@koa/cors'
import koaJson from 'koa-json'
import koaBodyParser from 'koa-bodyparser'
import koaHelment from 'koa-helmet'

import ms from 'ms'
import createDebug from 'debug'

import { ApiError } from '@openlab/deconf-api-toolkit'
import { AppRouter } from './lib/app-router'
import { AppContext } from './lib/context'

const debug = createDebug('cr:server')

/** A middleware to output requests when in debug mode */
function debugMiddleware(): Koa.Middleware {
  return async (ctx, next) => {
    const start = Date.now()
    await next()
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

function errorHandler(nodeEnv: string): Koa.Middleware {
  return async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      if (error instanceof ApiError) {
        ctx.status = error.status
        ctx.body = {
          error: error.message,
          codes: error.codes,
        }
      } else {
        ctx.status = 500
        ctx.body = {
          error:
            nodeEnv === 'production' ? 'Something went wrong' : error.message,
          stack: nodeEnv === 'production' ? null : error.stack,
        }
      }
    }
  }
}

export async function createServer(context: AppContext) {
  const router = new KoaRouter()

  const routers: AppRouter[] = []

  for (const appRouter of routers) {
    appRouter.apply(router)
  }

  const app = new Koa()
    .use(koaHelment())
    .use(koaCors({ origin: context.env.CLIENT_URL }))
    .use(koaJson())
    .use(koaBodyParser())
    .use(debugMiddleware())
    .use(errorHandler(context.env.NODE_ENV))
    .use(router.routes())
    .use(router.allowedMethods())

  const server = http.createServer(app.callback())

  return { app, server, router }
}
