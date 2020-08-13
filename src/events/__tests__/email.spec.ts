import emailEvent, { EmailEvent } from '../email'
import { TypedMockChow, createServer, mocked } from '../../test-utils'
import { MailService } from '@sendgrid/mail'

jest.mock('@sendgrid/mail')

let chow: TypedMockChow

beforeEach(() => {
  chow = createServer()
  emailEvent(chow)
})

afterEach(() => {
  mocked(MailService).mockReset()
})

it('should add an event to send text emails', async () => {
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

it('should add an event to send html emails', async () => {
  expect(MailService).toBeCalledTimes(1)
  const instance = mocked(MailService).mock.instances[0]

  expect(instance.setApiKey).toBeCalledWith('localhost_fake_key')

  chow.emit<EmailEvent>('email', {
    to: 'test@example.com',
    subject: 'Test email',
    html: '<p>Hello, world!</p>',
  })

  await chow.waitForEvents()

  expect(instance.send).toBeCalledWith({
    to: 'test@example.com',
    subject: 'Test email',
    from: 'admin@example.com',
    html: '<p>Hello, world!</p>',
    trackingSettings: expect.anything(),
  })
})
