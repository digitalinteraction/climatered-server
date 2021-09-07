import KoaRouter from '@koa/router'
import { CarbonRoutes } from '@openlab/deconf-api-toolkit'
import { AppContext, AppRouter, validateStruct } from '../lib/module.js'

type Context = AppContext

export class CarbonRouter implements AppRouter {
  #context: Context
  #routes: CarbonRoutes
  constructor(context: Context) {
    this.#context = context
    this.#routes = new CarbonRoutes(context)
  }

  apply(router: KoaRouter) {
    router.get('carbon.estimate', '/carbon', async (ctx) => {
      ctx.body = await this.#routes.getCarbon()
    })
  }
}
