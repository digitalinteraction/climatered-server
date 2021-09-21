import KoaRouter from '@koa/router'
import {
  RegistrationMailer,
  RegistrationRoutes,
  validateStruct,
} from '@openlab/deconf-api-toolkit'
import { Registration } from '@openlab/deconf-shared'
import { AppContext, AppRouter } from '../lib/module.js'

import { Describe, boolean, object, string } from 'superstruct'

const TokenStruct = object({
  token: string(),
})

// TODO: move somewhere better
export interface UserData {
  marketing: boolean
}
const UserDataStruct: Describe<UserData> = object({
  marketing: boolean(),
})

type Context = AppContext

export class RegistrationRouter implements AppRouter, RegistrationMailer {
  get #jwt() {
    return this.#context.jwt
  }
  get #email() {
    return this.#context.email
  }
  get #i18n() {
    return this.#context.i18n
  }
  get #url() {
    return this.#context.url
  }

  #context: Context
  #routes: RegistrationRoutes<any>
  constructor(context: Context) {
    this.#context = context
    this.#routes = new RegistrationRoutes({
      ...context,
      mailer: this,

      // TODO: work out how to properly type this
      userDataStruct: UserDataStruct as any,
    })
  }

  //
  // AppRouter
  //
  apply(router: KoaRouter) {
    router.get('registration.me', '/auth/me', async (ctx) => {
      const token = this.#jwt.getRequestAuth(ctx.request.header)
      ctx.body = await this.#routes.getRegistration(token)
    })

    router.post('registration.startLogin', '/auth/login', async (ctx) => {
      ctx.body = await this.#routes.startEmailLogin(ctx.request.body)
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
      ctx.body = await this.#routes.startRegister(ctx.request.body)
    })

    router.get(
      'registration.finishRegister',
      '/auth/register/:token',
      async (ctx) => {
        const { token } = validateStruct(ctx.params, TokenStruct)
        const url = await this.#routes.finishRegister(token)
        ctx.redirect(url.toString())
      }
    )

    router.delete('registration.unregister', '/auth/me', async (ctx) => {
      const token = this.#jwt.getRequestAuth(ctx.request.headers)
      ctx.body = await this.#routes.unregister(token)
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
    this.#email.sendTransactional(
      registration.email,
      this.#i18n.translate(registration.language, 'email.login.subject'),
      {
        body: this.#i18n.translate(registration.language, 'email.login.body'),
        action: this.#i18n.translate(
          registration.language,
          'email.login.action'
        ),
        url: this.#url.getServerLoginLink(token).toString(),
      }
    )
  }
  async sendVerifyEmail(
    registration: Registration,
    token: string
  ): Promise<void> {
    this.#email.sendTransactional(
      registration.email,
      this.#i18n.translate(registration.language, 'email.verify.subject'),
      {
        body: this.#i18n.translate(registration.language, 'email.verify.body'),
        action: this.#i18n.translate(
          registration.language,
          'email.verify.action'
        ),
        url: this.#url.getServerVerifyLink(token).toString(),
      }
    )
  }
}
