import emailEvent, { EmailEvent } from '../email'
import { TypedMockChow, createServer, mocked } from '../../test-utils'
import { MailService } from '@sendgrid/mail'

jest.mock('@sendgrid/mail')

let chow: TypedMockChow

beforeEach(() => {
  chow = createServer()
  emailEvent(chow)
})

it('should add an event to send emails', async () => {
  expect(MailService).toBeCalledTimes(1)
  const instance = mocked(MailService).mock.instances[0]

  expect(instance.setApiKey).toBeCalledWith('localhost_fake_key')

  chow.emit<EmailEvent>('email', {
    to: 'test@example.com',
    subject: 'Test email',
    text: 'Hello, world!',
  })

  await chow.waitForEvents()

  expect(instance.send).toBeCalledWith({
    to: 'test@example.com',
    subject: 'Test email',
    from: 'admin@example.com',
    text: 'Hello, world!',
    trackingSettings: expect.anything(),
  })
})
