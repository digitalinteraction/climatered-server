import KoaRouter from '@koa/router'
import { object, string } from 'superstruct'

import { AttendanceRoutes, validateStruct } from '@openlab/deconf-api-toolkit'
import { AppContext, AppRouter } from '../lib/module.js'

const SessionIdStruct = object({
  sessionId: string(),
})

type Context = AppContext

export class AttendanceRouter implements AppRouter {
  get #jwt() {
    return this.#context.jwt
  }

  #context: Context
  #routes: AttendanceRoutes
  constructor(context: Context) {
    this.#context = context
    this.#routes = new AttendanceRoutes(context)
  }

  apply(router: KoaRouter): void {
    router.post(
      'attendance.attend',
      '/attendance/attend/:sessionId',
      async (ctx) => {
        const { sessionId } = validateStruct(ctx.params, SessionIdStruct)
        const token = this.#jwt.getRequestAuth(ctx.request.headers)
        ctx.body = await this.#routes.attend(token, sessionId)
      }
    )

    router.post(
      'attendance.unattend',
      '/attendance/unattend/:sessionId',
      async (ctx) => {
        const { sessionId } = validateStruct(ctx.params, SessionIdStruct)
        const token = this.#jwt.getRequestAuth(ctx.request.headers)
        ctx.body = await this.#routes.unattend(token, sessionId)
      }
    )

    router.get('attendance.user', '/attendance/me', async (ctx) => {
      const token = this.#jwt.getRequestAuth(ctx.request.headers)
      ctx.body = await this.#routes.getUserAttendance(token)
    })

    router.get('attendance.session', '/attendance/:sessionId', async (ctx) => {
      const { sessionId } = validateStruct(ctx.params, SessionIdStruct)
      const token = this.#jwt.getRequestAuth(ctx.request.headers)
      ctx.body = await this.#routes.getSessionAttendance(token, sessionId)
    })
  }
}
