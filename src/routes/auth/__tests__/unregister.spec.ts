import {
  TypedMockChow,
  createServer,
  mocked,
  AuthJwt,
  createAuthToken,
} from '../../../test-utils'
import route from '../unregister'

let chow: TypedMockChow
let attendee: AuthJwt

beforeEach(() => {
  attendee = createAuthToken(['attendee'])
  chow = createServer()
  route(chow)
})

describe('DELETE /me', () => {
  it('should unregister that email', async () => {
    mocked(chow.auth.fromRequest).mockResolvedValue(attendee)

    await chow.http('delete', '/me')

    expect(chow.users.unregister).toBeCalledWith(attendee.sub)
  })
})
