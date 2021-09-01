import { MailService as Sendgrid } from '@sendgrid/mail'

import {
  DeconfBaseContext,
  EmailService as DeconfEmailService,
} from '@openlab/deconf-api-toolkit'

type Context = Pick<DeconfBaseContext, 'env' | 'config'>

export class EmailService implements Readonly<DeconfEmailService> {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  sendEmail(to: string, subject: string, html: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  sendTransactional(
    to: string,
    subject: string,
    templateId: string,
    data: any
  ) {
    throw new Error('Method not implemented')
  }
}
