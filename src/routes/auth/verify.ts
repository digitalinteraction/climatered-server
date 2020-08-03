import { TypedChow } from '../../server'
import { HttpMessage, HttpRedirect } from '@robb_j/chowchow/dist'
import { assertStruct, Translator } from '../../structs'
import { VerifyJwt, AuthJwt } from '../../services/jwt'

import createDebug = require('debug')

const debug = createDebug('api:route:verify')

class BadToken extends Error {}

export default function verify(chow: TypedChow) {
  //
  // GET /verify?token
  //
  chow.route(
    'get',
    '/verify/:token',
    async ({ request, users, url, jwt, redis }) => {
      try {
        debug(`token="${request.params.token}"`)
        //
        // Make sure they visited with a valid verify token
        //
        const verify = jwt.verify(request.params.token!) as VerifyJwt
        if (typeof verify !== 'object') throw new BadToken()
        if (verify.typ !== 'verify') throw new BadToken()

        //
        // Make sure there is an active registration token for that verif token
        //
        const registration = await users.getRegistration(verify.sub, false)
        debug(`registration.id=${registration?.id}`)

        if (!registration) throw new BadToken()

        //
        // You can only use a verify token once, so go to login instead?
        // Its a long-lived jwt so could be dangerous to be re-usable
        //
        if (registration.verified) {
          const link = url.forWeb('/login')
          return new HttpRedirect(link.toString())
        }

        await users.verify(registration.email)

        // Check if they're also a translator
        const allTranslators = await redis.getJson<Translator[]>(
          'schedule.translators',
          []
        )
        const translator = allTranslators.find((t) =>
          users.compareEmails(t.email, registration.email)
        )
        debug('translator=%o', translator)

        //
        // Add the translator role if they are also one (unlikely)
        //
        const roles = ['attendee']
        if (translator) roles.push('translator')

        //
        // Generate an auth token and link to log in with
        //
        const auth: AuthJwt = {
          typ: 'auth',
          sub: registration.email,
          user_roles: roles,
          user_lang: registration.language,
        }
        const link = url.forWeb('/_token')
        link.searchParams.set('token', jwt.sign(auth))

        //
        // Return a redirection to a logged-in app
        //
        return new HttpRedirect(link.toString())
      } catch (error) {
        const link = url.forWeb('/error')

        let message
        if (error instanceof BadToken) {
          message = 'Bad token'
        } else {
          message = 'Something went wrong'
        }

        link.searchParams.set('message', message)
        return new HttpRedirect(link.toString())
      }
    }
  )
}
