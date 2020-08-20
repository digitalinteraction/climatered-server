import socket from '../accept-interpret'
import {
  TypedMockChow,
  createServer,
  AuthJwt,
  createAuthToken,
  mocked,
} from '../../../test-utils'

let chow: TypedMockChow
let translator: AuthJwt

beforeEach(() => {
  chow = createServer()
  translator = createAuthToken(['translator'])
  socket(chow)
})

describe('@accept-interpret', () => {
  it('should broadcast to the interpret room', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('accept-interpret', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith(
      'interpret_001_fr',
      'interpret-accepted',
      {
        slug: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      }
    )
  })
})
