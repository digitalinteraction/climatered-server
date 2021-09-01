import {
  DeconfBaseContext,
  UrlService as DeconfUrlService,
} from '@openlab/deconf-api-toolkit'

type Context = Pick<DeconfBaseContext, 'env'>

export class UrlService implements Readonly<DeconfUrlService> {
  get #env() {
    return this.#context.env
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  getSessionLink(sessionId: string): URL {
    return new URL(`session/${sessionId}`, this.#env.CLIENT_URL)
  }

  getClientLoginLink(token: string): URL {
    const url = new URL('_auth', this.#env.CLIENT_URL)

    const params = new URLSearchParams()
    params.set('token', token)
    url.hash = params.toString()

    return url
  }
}
