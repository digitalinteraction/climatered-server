import { TypedMockChow, createServer, mocked } from '../../../test-utils'
import emailRequest from '../email-request'
import { HttpMessage } from '@robb_j/chowchow'

let chow: TypedMockChow
let emailSpy: jest.Mock

beforeEach(() => {
  chow = createServer()
  chow.event('email', emailSpy)

  emailSpy = jest.fn()
  emailRequest(chow)

  mocked(chow.jwt.sign).mockReturnValue('fake_login_token')
})

describe('GET /login/email', () => {
  it("should validate the user's email", async () => {
    const query = {
      email: 'not_an_email',
    }

    const res = await chow.http('get', '/login/email', { query })

    expect(res).toBeInstanceOf(HttpMessage)
    expect(res.status).toEqual(400)
    expect(res.body).toEqual({ message: 'Bad email' })
  })

  it('should sign an login token for valid email addresses', async () => {
    const query = {
      email: 'user@example.com',
    }

    await chow.http('get', '/login/email', { query })

    expect(chow.jwt.sign).toBeCalledWith(
      { typ: 'login', sub: 'user@example.com' },
      { expiresIn: '30m' }
    )
  })

  it('should send the user an email with the token in it', async () => {
    const query = {
      email: 'user@example.com',
    }

    await chow.http('get', '/login/email', { query })

    const expectedUrl =
      'http://api.localhost/login/email/callback?token=fake_login_token'

    expect(chow.emit).toBeCalledWith('email', {
      to: 'user@example.com',
      subject: expect.any(String),
      text: expect.stringContaining(expectedUrl),
    })
  })

  it('should return a http/200', async () => {
    const query = {
      email: 'user@example.com',
    }

    const res = await chow.http('get', '/login/email', { query })

    expect(res).toEqual({ message: 'ok' })
  })
})
