import route from '../me'
import {
  TypedMockChow,
  createServer,
  mocked,
  createRegistration,
  createAuthToken,
  AuthJwt,
} from '../../../test-utils'
import { Registration } from '../../../structs'

let chow: TypedMockChow
let auth: AuthJwt
let attendee: Registration

beforeEach(() => {
  chow = createServer()
  auth = createAuthToken(['attendee'])
  attendee = createRegistration()
  route(chow)
})

describe('GET /me', () => {
  it('should return the authenticated user', async () => {
    mocked(chow.auth.fromRequest).mockResolvedValue(auth)
    mocked(chow.users.getRegistration).mockResolvedValue(attendee)

    const res = await chow.http('get', '/me')

    expect(res.user).toEqual(attendee)
  })
})
