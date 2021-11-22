import KoaRouter from '@koa/router'
import {
  ApiError,
  RegistrationMailer,
  RegistrationRoutes,
  validateStruct,
  VOID_RESPONSE,
} from '@openlab/deconf-api-toolkit'
import { Registration } from '@openlab/deconf-shared'
import { AppContext, AppRouter } from '../lib/module.js'

import { Describe, boolean, object, string } from 'superstruct'

const TokenStruct = object({
  token: string(),
})

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
      ctx.body = await this.#routes
        .startEmailLogin(ctx.request.body)
        .catch((error) => VOID_RESPONSE)
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
        try {
          const { token } = validateStruct(ctx.params, TokenStruct)
          const url = await this.#routes.finishRegister(token)
          ctx.redirect(url.toString())
        } catch (error) {
          let code: string | undefined = undefined
          console.log(error)

          if (
            error instanceof ApiError &&
            error.codes.includes('registration.alreadyVerified')
          ) {
            code = 'already_verified'
          }

          ctx.redirect(this.#url.getClientErrorLink(code).toString())
        }
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
    const t = (k: string) => this.#i18n.translate(registration.language, k)

    this.#email.sendTransactional(
      registration.email,
      t('email.login.subject'),
      {
        body: t('email.login.body'),
        action: t('email.login.action'),
        url: this.#url.getServerLoginLink(token).toString(),
        greeting: t('email.general.greeting'),
        signature: t('email.general.signature'),
      }
    )
  }
  async sendVerifyEmail(
    registration: Registration,
    token: string
  ): Promise<void> {
    const t = (k: string) => this.#i18n.translate(registration.language, k)

    this.#email.sendTransactional(
      registration.email,
      t('email.verify.subject'),
      {
        body: t('email.verify.body'),
        action: t('email.verify.action'),
        url: this.#url.getServerVerifyLink(token).toString(),
        greeting: t('email.general.greeting'),
        signature: t('email.general.signature'),
      }
    )
  }
  async sendAlreadyRegisteredEmail(
    registration: Registration,
    authToken: string
  ): Promise<void> {
    const t = (k: string) => this.#i18n.translate(registration.language, k)

    this.#email.sendTransactional(
      registration.email,
      t('email.userExists.subject'),
      {
        body: t('email.userExists.body'),
        action: t('email.userExists.action'),
        url: this.#url.getClientLoginLink(authToken),
        greeting: t('email.general.greeting'),
        signature: t('email.general.signature'),
      }
    )
  }
}
