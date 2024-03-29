import KoaRouter from '@koa/router'
import { VOID_RESPONSE } from '@openlab/deconf-api-toolkit'
import { AppContext, AppRouter } from '../lib/module.js'

type Context = AppContext

export class GeneralRouter implements AppRouter {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  apply(router: KoaRouter): void {
    router.get('general.hello', '/', async (ctx) => {
      ctx.body = {
        ...VOID_RESPONSE,
        pkg: {
          name: this.#context.pkg.name,
          version: this.#context.pkg.version,
        },
      }
    })
  }
}
