import { TypedChow } from '../../server'
import emailRegex = require('email-regex')
import { HttpMessage } from '@robb_j/chowchow/dist'

import { EmailEvent } from '../../events/email'
import { LoginJwt } from '../../services/jwt'

export default function emailRequest(chow: TypedChow) {
  chow.route(
    'get',
    '/login/email',
    async ({ request, jwt, url, emit, users }) => {
      //
      // Get and validate their email
      //
      const email = (request.query.email ?? '') as string
      if (typeof email !== 'string' || !emailRegex().test(email)) {
        return new HttpMessage(400, 'Bad email')
      }

      //
      // Find a matching registration
      //
      const registration = await users.getRegistration(email)
      if (!registration) return new HttpMessage(400, 'Bad email')

      //
      // Generate a link to send them back to
      // with the jwt as a query parameter
      //
      const token: LoginJwt = { typ: 'login', sub: email.toLowerCase() }
      const link = url.forSelf('/login/email/callback')
      link.searchParams.set('token', jwt.sign(token, { expiresIn: '30m' }))

      //
      // Send the user an email
      //
      emit<EmailEvent>('email', {
        to: email,
        subject: 'Climate:Red Login',
        text: `Hi,\n\nHere is your login link: ${link.toString()}`,
      })

      return { message: 'ok' }
    }
  )
}
