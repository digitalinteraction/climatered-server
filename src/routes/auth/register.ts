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
    async ({ request, users, emit, jwt, url }) => {
      //
      // Make sure they passed up the right thing
      //
      debug('body=%O', request.body)
      const [err, body] = validateStruct(request.body, RegisterBodyStruct)

      if (!body) {
        throw err!
      }

      // TODO: Check for an existing registration ...
      const registration = await users.getRegistration(body.email)
      if (registration) {
        emit<EmailEvent>('email', {
          to: registration.email,
          subject: 'Climate:Red registration',
          text: `Someone tried to register with your email address, but you have already registered`,
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
        subject: 'Complete your registration',
        text: `Hi,\n\nClick here to verify: ${link.toString()}`,
      })

      return new HttpMessage(200, 'email sent')
    }
  )
}
