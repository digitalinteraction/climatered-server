import { TypedMockChow, createServer, mocked } from '../../../test-utils'
import registerRoute from '../register'

let chow: TypedMockChow
let emailSpy: jest.Mock

beforeEach(() => {
  emailSpy = jest.fn()
  chow = createServer()

  registerRoute(chow)
  chow.event('email', (ctx) => emailSpy(ctx.event.payload))
})

describe('POST /register', () => {
  it('should send a verification email', async () => {
    mocked(chow.jwt.sign).mockReturnValue('some_fake_jwt_token')

    const body = {
      name: 'Geoff Testington',
      email: 'new@example.com',
      language: 'en',
      country: 'GB',
      affiliation: 'Open Lab',
    }
    await chow.http('post', '/register', { body })

    await chow.waitForEvents()

    const verifyUrl = chow.env.SELF_URL + '/verify/some_fake_jwt_token'

    expect(emailSpy).toBeCalledWith({
      to: 'new@example.com',
      subject: expect.any(String),
      text: expect.stringContaining(verifyUrl),
    })
  })

  it('should create a registration', async () => {
    const body = {
      name: 'Geoff Testington',
      email: 'new@example.com',
      language: 'en',
      country: 'GB',
      affiliation: 'Open Lab',
    }
    await chow.http('post', '/register', { body })

    expect(chow.users.register).toBeCalledWith(body)
  })

  it('should sign a verify token', async () => {
    const body = {
      name: 'Geoff Testington',
      email: 'new@example.com',
      language: 'en',
      country: 'GB',
      affiliation: 'Open Lab',
    }
    await chow.http('post', '/register', { body })

    expect(chow.jwt.sign).toBeCalledWith({
      typ: 'verify',
      sub: 'new@example.com',
    })
  })

  it('should not send an email if they are already registered', async () => {
    const fakeReg: any = {
      email: 'new@example.com',
    }
    mocked(chow.users.getRegistration).mockResolvedValue(fakeReg)

    const body = {
      name: 'Geoff Testington',
      email: 'new@example.com',
      language: 'en',
      country: 'GB',
      affiliation: 'Open Lab',
    }
    await chow.http('post', '/register', { body })

    await chow.waitForEvents()

    const verifyUrl = chow.env.SELF_URL + '/verify/some_fake_jwt_token'

    expect(emailSpy).toBeCalledWith({
      to: 'new@example.com',
      subject: expect.any(String),
      text: expect.not.stringContaining(verifyUrl),
    })
  })
})
