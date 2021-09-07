import KoaRouter from '@koa/router'
import {
  RegistrationMailer,
  RegistrationRoutes,
} from '@openlab/deconf-api-toolkit'
import { Registration } from '@openlab/deconf-shared'
import { AppContext, AppRouter, validateStruct } from '../lib/module.js'

import { object, string } from 'superstruct'

const TokenStruct = object({
  token: string(),
})

type Context = AppContext

export class RegistrationRouter implements AppRouter, RegistrationMailer {
  get #jwt() {
    return this.#context.jwt
  }
  get #email() {
    return this.#context.email
  }

  #context: Context
  #routes: RegistrationRoutes
  constructor(context: Context) {
    this.#context = context
    this.#routes = new RegistrationRoutes({ ...context, mailer: this })
  }

  //
  // AppRouter
  //
  apply(router: KoaRouter) {
    router.get('registration.me', '/auth/me', async (ctx) => {
      const token = this.#jwt.getRequestAuth(ctx.request.header)
      ctx.body = {
        registration: await this.#routes.getRegistration(token),
      }
    })

    router.post('registration.startLogin', '/auth/login', async (ctx) => {
      await this.#routes.startEmailLogin(ctx.request.body)
      ctx.body = 'ok'
    })

    router.get(
      'registration.finishLogin',
      '/auth/login/:token',
      async (ctx) => {
        const { token } = validateStruct(ctx.params, TokenStruct)
        const url = await this.#routes.finishEmailLogin(token)
        ctx.redirect(url.toString())
      }
    )

    router.post('registration.startRegister', '/auth/register', async (ctx) => {
      await this.#routes.startRegister(ctx.request.body)
      ctx.body = 'ok'
    })

    router.get(
      'registration.finishRegister',
      '/auth/register/:token',
      async (ctx) => {
        const { token } = validateStruct(ctx.params, TokenStruct)
        ctx.body = {
          token: await this.#routes.finishRegister(token),
        }
      }
    )

    router.delete('registration.unregister', '/auth/me', async (ctx) => {
      const token = this.#jwt.getRequestAuth(ctx.request.headers)
      await this.#routes.unregister(token)
      ctx.body = 'ok'
    })
  }

  //
  // RegistrationMailer
  //
  async sendLoginEmail(
    registration: Registration,
    token: string
  ): Promise<void> {
    console.log(
      'TODO: sendLoginEmail email=%o token=%o',
      registration.email,
      token
    )
    // throw new Error('Method not implemented.')
  }
  async sendVerifyEmail(
    registration: Registration,
    token: string
  ): Promise<void> {
    // throw new Error('Method not implemented.')
    console.log(
      'TODO: sendVerifyEmail email=%o token=%o',
      registration.email,
      token
    )
  }
}
