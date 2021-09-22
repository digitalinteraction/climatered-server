import KoaRouter from '@koa/router'
import { ApiError } from '@openlab/deconf-api-toolkit'
import { AppContext, AppRouter } from '../lib/module.js'

type Context = AppContext

export class MetricsRouter implements AppRouter {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  apply(router: KoaRouter): void {
    router.get('metrics.index', '/metrics', async (ctx) => {
      const authToken = this.#context.jwt.getRequestAuth(ctx.request.headers)

      if (!authToken || !authToken.user_roles.includes('admin')) {
        throw ApiError.unauthorized()
      }

      const rawEvents = await this.#context.metricsRepo.getEvents()
      ctx.body = {
        events: rawEvents.map((e) => ({
          created: e.created,
          eventName: e.event,
          payload: e.data,
        })),
      }
    })
  }
}
