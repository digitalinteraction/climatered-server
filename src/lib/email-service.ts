import { MailService as Sendgrid } from '@sendgrid/mail'

import { EmailService as DeconfEmailService } from '@openlab/deconf-api-toolkit'
import { AppContext } from './context'

// Disable all sendgrid tracking
const TRACKING_SETTINGS = {
  trackingSettings: {
    clickTracking: { enable: false },
    openTracking: { enable: false },
    subscriptionTracking: { enable: false },
    ganalytics: { enable: false },
  },
}

type Context = Pick<AppContext, 'env' | 'config'>

export class EmailService implements Readonly<DeconfEmailService> {
  get #config() {
    return this.#context.config
  }
  get #env() {
    return this.#context.env
  }

  #context: Context
  #mail = new Sendgrid()
  constructor(context: Context) {
    this.#context = context
    this.#mail.setApiKey(this.#env.SENDGRID_API_KEY)
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.#mail.send({
      to,
      subject,
      html,
      replyTo: this.#config.mail.replyToEmail,
      from: this.#config.mail.fromEmail,
      ...TRACKING_SETTINGS,
    })
  }

  async sendTransactional(
    to: string,
    subject: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.#mail.send({
      to,
      subject,
      replyTo: this.#config.mail.replyToEmail,
      from: this.#config.mail.fromEmail,
      templateId: this.#config.sendgrid.templateId,
      dynamicTemplateData: {
        subject,
        ...data,
      },
      // hideWarnings: true,
    })
  }
}
