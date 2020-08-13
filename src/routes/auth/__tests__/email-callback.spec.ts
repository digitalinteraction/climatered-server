import {
  TypedMockChow,
  createServer,
  mocked,
  createRegistration,
} from '../../../test-utils'
import emailCallbackRoute from '../email-callback'
import { HttpRedirect } from '@robb_j/chowchow'

let chow: TypedMockChow

beforeEach(() => {
  chow = createServer()
  emailCallbackRoute(chow)

  mocked(chow.jwt.verify).mockReturnValue({
    typ: 'login',
    sub: 'user@example.com',
    user_roles: ['attendee', 'translator'],
  })

  mocked(chow.jwt.sign).mockReturnValue('fake_auth_token')

  const registration = createRegistration()
  mocked(chow.users.getRegistration).mockResolvedValue(registration)
})

describe('GET /login/email/callback', () => {
  it("should validate the user's login token", async () => {
    const query = {
      token: 'fake_login_token',
    }

    await chow.http('get', '/login/email/callback', { query })

    expect(chow.jwt.verify).toBeCalledWith('fake_login_token')
  })

  it('should sign the users new auth token', async () => {
    const query = {
      token: 'fake_login_token',
    }

    await chow.http('get', '/login/email/callback', { query })

    expect(chow.jwt.sign).toBeCalledWith({
      typ: 'auth',
      sub: 'user@example.com',
      user_roles: ['attendee', 'translator'],
      user_lang: 'en',
    })
  })

  it('should redirect the user web interface', async () => {
    const query = {
      token: 'fake_login_token',
    }

    const res = await chow.http('get', '/login/email/callback', { query })

    expect(res).toBeInstanceOf(HttpRedirect)
    expect(res.location).toEqual(
      'http://web.localhost/_token?token=fake_auth_token'
    )
  })
})
