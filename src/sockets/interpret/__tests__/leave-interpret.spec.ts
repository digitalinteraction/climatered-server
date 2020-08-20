import socket from '../leave-interpret'
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

async function setup() {
  const socket = chow.io()

  mocked(chow.auth.fromSocket).mockResolvedValue(translator)

  return { socket }
}

describe('@leave-interpret', () => {
  it('should leave the interpret room', async () => {
    const { socket } = await setup()

    await socket.emit('leave-interpret', '001', 'fr')

    expect(socket.leave).toBeCalledWith('interpret_001_fr')
  })

  it('should notify the interpret room', async () => {
    const { socket } = await setup()

    await socket.emit('leave-interpret', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith(
      'interpret_001_fr',
      'interpret-left',
      {
        slug: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      }
    )
  })
})
