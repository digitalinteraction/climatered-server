import { TypedChow } from '../../server'
import emailRegex = require('email-regex')
import { HttpMessage } from '@robb_j/chowchow/dist'

import { Translator } from '../../structs'
import { EmailEvent } from '../../events/email'
import { LoginJwt } from '../../services/jwt'

export default function emailRequest(chow: TypedChow) {
  chow.route(
    'get',
    '/login/email',
    async ({ request, jwt, url, emit, users, redis, i18n }) => {
      //
      // Get and validate their email
      //
      const email = (request.query.email ?? '') as string
      if (typeof email !== 'string' || !emailRegex().test(email)) {
        return new HttpMessage(400, 'Bad email')
      }

      //
      // Check if they are a translator
      //
      const allTranslators = await redis.getJson<Translator[]>(
        'schedule.translators',
        []
      )
      const translator = allTranslators.find((t) =>
        users.compareEmails(t.email, email)
      )

      //
      // Find a matching registration
      //
      const registration = await users.getRegistration(email, true)
      if (!translator && !registration) return new HttpMessage(400, 'Bad email')

      //
      // Decide roles
      //
      const roles = []
      if (registration) roles.push('attendee')
      if (translator) roles.push('translator')

      //
      // Generate a link to send them back to
      // with the jwt as a query parameter
      //
      const token: LoginJwt = {
        typ: 'login',
        sub: email.toLowerCase(),
        user_roles: roles,
      }
      const link = url.forSelf('/login/email/callback')
      link.searchParams.set('token', jwt.sign(token, { expiresIn: '30m' }))

      // Work out a locale to send the email with
      const locale: any = registration?.language ?? 'en'

      //
      // Send the user an email
      //
      emit<EmailEvent>('email', {
        to: email,
        subject: i18n.translate(locale, 'email.login.subject'),
        data: {
          greeting: i18n.translate(locale, 'email.general.greeting'),
          body: i18n.translate(locale, 'email.login.body'),
          action: i18n.translate(locale, 'email.login.action'),
          url: link.toString(),
          signature: i18n.translate(locale, 'email.general.signature'),
        },
      })

      return { message: 'ok' }
    }
  )
}
