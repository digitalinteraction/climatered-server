import { HttpMessage } from '@robb_j/chowchow'

import { TypedChow } from '../../server'
import { RegisterBodyStruct, validateStruct } from '../../structs'
import { EmailEvent } from '../../events/email'
import { VerifyJwt } from '../../services/jwt'

import createDebug = require('debug')

const debug = createDebug('api:route:register')

export default function register(chow: TypedChow) {
  //
  // POST /register
  //
  chow.route(
    'post',
    '/register',
    async ({ request, users, emit, jwt, url, i18n }) => {
      //
      // Make sure they passed up the right thing
      //
      debug('body=%O', request.body)
      const [err, body] = validateStruct(request.body, RegisterBodyStruct)

      if (!body) {
        throw err!
      }

      // re-type the language so it matches i18n's locale
      const locale = body.language as any

      //
      // Check for an existing verified registrations
      //
      const registration = await users.getRegistration(body.email, true)
      if (registration) {
        emit<EmailEvent>('email', {
          to: registration.email,
          subject: i18n.translate(locale, 'email.userExists.subject'),
          data: {
            greeting: i18n.translate(locale, 'email.general.greeting'),
            body: i18n.translate(locale, 'email.userExists.body'),
            action: i18n.translate(locale, 'email.userExists.action'),
            url: url.forWeb('/login').toString(),
            signature: i18n.translate(locale, 'email.general.signature'),
          },
        })
        return new HttpMessage(200, 'email sent')
      }

      //
      // Make the registration
      //
      await users.register(body)
      const { email } = body

      const verify: VerifyJwt = {
        typ: 'verify',
        sub: email.toLowerCase(),
      }
      const link = url.forSelf(`/verify/${jwt.sign(verify)}`)

      // Send verification email
      emit<EmailEvent>('email', {
        to: email,
        subject: i18n.translate(locale, 'email.pleaseVerify.subject'),
        data: {
          greeting: i18n.translate(locale, 'email.general.greeting'),
          body: i18n.translate(locale, 'email.pleaseVerify.body'),
          signature: i18n.translate(locale, 'email.general.signature'),
          action: i18n.translate(locale, 'email.pleaseVerify.action'),
          url: link.toString(),
        },
      })

      return new HttpMessage(200, 'email sent')
    }
  )
}
