import KoaRouter from '@koa/router'
import { enums, object } from 'superstruct'
import { CONTENT_KEYS } from '../cmd/fetch-content-command.js'
import { AppContext, AppRouter, validateStruct } from '../lib/module.js'

const SlugStruct = object({
  slug: enums(CONTENT_KEYS),
})

type Context = AppContext

export class ContentRouter implements AppRouter {
  get #store() {
    return this.#context.store
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  apply(router: KoaRouter) {
    router.get('content.get', '/content/:slug', async (ctx) => {
      const { slug } = validateStruct(ctx.params, SlugStruct)

      ctx.body = {
        content: await this.#store.retrieve(`content.${slug}`),
      }
    })
  }
}
