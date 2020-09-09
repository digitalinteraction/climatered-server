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
let logSpy: jest.Mock

beforeEach(() => {
  chow = createServer()
  translator = createAuthToken(['translator'])
  socket(chow)

  logSpy = chow.spyEvent('log')
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

  it('should log an event', async () => {
    const { socket } = await setup()

    await socket.emit('leave-interpret', '001', 'fr')

    expect(logSpy).toBeCalledWith({
      action: 'leave-interpret',
      socket: socket.id,
      data: {
        sessionId: '001',
        channel: 'fr',
        email: translator.sub,
      },
    })
  })
})
