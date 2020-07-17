import createDebug = require('debug')
import { MailService } from '@sendgrid/mail'
import { TypedChow } from '../server'

const debug = createDebug('api:event:email')

interface BaseEmail {
  to: string
  from?: string
  subject: string
  text?: string
  html?: string
}

type EmailToSend = BaseEmail & ({ text: string } | { html: string })

export interface EmailEvent {
  name: 'email'
  payload: EmailToSend
}

// From @sendgrid/mail's TrackingSettings
const TRACKING_SETTINGS = {
  trackingSettings: {
    clickTracking: { enable: false },
    openTracking: { enable: false },
    subscriptionTracking: { enable: false },
    ganalytics: { enable: false },
  },
}

export default function (chow: TypedChow) {
  const mail = new MailService()
  mail.setApiKey(chow.env.SENDGRID_API_KEY)

  chow.event<EmailEvent>('email', async ({ event }) => {
    const {
      to,
      from = chow.env.SENDGRID_FROM,
      subject,
      text,
      html,
    } = event.payload

    debug(`to=${to} subject=${subject}`)

    if (html) {
      await mail.send({ to, from, subject, html, ...TRACKING_SETTINGS })
    } else if (text) {
      await mail.send({ to, from, subject, text, ...TRACKING_SETTINGS })
    }
  })
}
