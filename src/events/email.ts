import createDebug = require('debug')
import { MailService } from '@sendgrid/mail'
import { TypedChow } from '../server'

const debug = createDebug('api:event:email')

interface BaseEmail {
  to: string
  from?: string
  subject: string
}

interface TextEmail extends BaseEmail {
  text: string
}

interface HtmlEmail extends BaseEmail {
  html: string
}

interface TransactionalEmail extends BaseEmail {
  data: {
    greeting: string
    body: string
    signature: string
    action: string
    url: string
  }
}

type EmailToSend = TextEmail | HtmlEmail | TransactionalEmail

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

  debug('transactional_id=%s', chow.env.SENDGRID_TRANSACTIONAL_TEMPLATE_ID)

  chow.event<EmailEvent>('email', async ({ event }) => {
    const { to, from = chow.env.SENDGRID_FROM, subject } = event.payload

    debug(`to=${to} subject=${subject}`)

    if ((event.payload as TextEmail).text) {
      //
      // Send a text email
      //
      const { text } = event.payload as TextEmail
      await mail.send({ to, from, subject, text, ...TRACKING_SETTINGS })
      return
    }

    if ((event.payload as HtmlEmail).html) {
      //
      // Send a html email
      //
      const { html } = event.payload as HtmlEmail
      await mail.send({ to, from, subject, html, ...TRACKING_SETTINGS })
      return
    }

    if ((event.payload as TransactionalEmail).data) {
      //
      // Send a transactional email
      //
      const { data } = event.payload as TransactionalEmail
      debug('data=%O', { subject, ...data })

      await mail.send({
        to,
        from,
        subject,
        templateId: chow.env.SENDGRID_TRANSACTIONAL_TEMPLATE_ID,
        dynamicTemplateData: {
          subject: subject,
          ...data,
        },
        hideWarnings: true,
      })
      return
    }
  })
}
