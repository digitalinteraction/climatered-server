import dedent from 'dedent'
import KoaRouter from '@koa/router'
import {
  ApiError,
  ConferenceRoutes,
} from '@openlab/deconf-api-toolkit/dist/module'
import { AppContext, AppRouter, validateStruct } from '../lib/module'

import { object, string } from 'superstruct'

const SessionIdStruct = object({
  sessionId: string(),
})

type Context = AppContext

export class ConferenceRouter implements AppRouter {
  get #jwt() {
    return this.#context.jwt
  }

  #context: Context
  #routes: ConferenceRoutes
  constructor(context: Context) {
    this.#context = context
    this.#routes = new ConferenceRoutes(context)
  }

  apply(router: KoaRouter) {
    router.get('conference.sessions', '/schedule', async (ctx) => {
      ctx.body = await this.#routes.getSchedule()
    })

    router.get('conference.ics', '/schedule/:sessionId/ics', async (ctx) => {
      const { sessionId } = validateStruct(ctx.params, SessionIdStruct)
      const token = this.#jwt.getRequestAuth(ctx.request.headers)
      const locale = token?.user_lang ?? 'en'

      ctx.set('content-type', 'text/calendar')
      ctx.set('content-disposition', `attachment; filename="${sessionId}.ics`)
      ctx.body = this.#routes.generateIcs(locale, sessionId)
    })

    router.get(
      'conference.links',
      '/schedule/:sessionId/links',
      async (ctx) => {
        const { sessionId } = validateStruct(ctx.params, SessionIdStruct)
        const token = this.#jwt.getRequestAuth(ctx.request.headers)

        ctx.body = {
          links: this.#routes.getLinks(token, sessionId),
        }
      }
    )

    router.get('conference.lint', '/schedule/lint', async (ctx) => {
      const token = this.#jwt.getRequestAuth(ctx.request.headers)
      if (!token || !token.user_roles.includes('admin')) {
        throw ApiError.unauthorized()
      }

      const title = 'ClimateRed Session Report'
      const errors = await this.#routes.lintSessions()

      const errorHtml = errors.map(
        (error) => dedent`
          <h2> ${error.title} </h2>
          <p> ${error.subtitle} </p>
          <ul>
            ${error.messages.map((m) => `<li><code>${m}</code></li>`)}
          </ul>
        `
      )

      ctx.set('content-type', 'text/html; charset=UTF-8')
      ctx.body = dedent`
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
        </head>
        <body>
          <h1>${title}</h1>
          <article>
            ${errorHtml}
          </article>
        </body>
        </html>
      `
    })
  }
}