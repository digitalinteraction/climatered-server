import stopChannelSocket from '../stop-interpret'
import {
  TypedMockChow,
  createServer,
  mocked,
  AuthJwt,
  createAuthToken,
} from '../../../test-utils'

let chow: TypedMockChow
let translator: AuthJwt

beforeEach(() => {
  chow = createServer()
  translator = createAuthToken(['translator'])
  stopChannelSocket(chow)
})

async function setup() {
  const socket = chow.io()

  const packetKey = `interpreter_${socket.id}`
  const activeKey = `interpreter_001_fr`

  mocked(chow.auth.fromSocket).mockResolvedValueOnce(translator)
  await chow.redis.set(activeKey, socket.id)
  await chow.redis.set(packetKey, '001;fr')

  return { socket, packetKey, activeKey }
}

describe('@stop-interpret()', () => {
  it('should unset the active translator and their packet', async () => {
    const { socket, packetKey, activeKey } = await setup()

    await socket.emit('stop-interpret')

    expect(chow.redis.del).toBeCalledWith(activeKey)
    expect(chow.redis.del).toBeCalledWith(packetKey)
  })

  it('should emit to the interpreter room', async () => {
    const { socket } = await setup()

    await socket.emit('stop-interpret')

    expect(chow.emitToRoom).toBeCalledWith(
      'interpret_001_fr',
      'interpret-stopped',
      {
        slug: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      }
    )
  })

  it('should emit to the channel room', async () => {
    const { socket } = await setup()

    await socket.emit('stop-interpret')

    expect(chow.emitToRoom).toBeCalledWith('channel_001_fr', 'channel-stopped')
  })
})
