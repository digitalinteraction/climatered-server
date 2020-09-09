import socket from '../join-interpret'
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

const translatorIsh = {
  slug: expect.any(String),
  name: expect.any(String),
  email: expect.any(String),
}

beforeEach(() => {
  chow = createServer()
  translator = createAuthToken(['translator'])
  socket(chow)

  logSpy = chow.spyEvent('log')
})

async function setup() {
  const socket = chow.io()

  mocked(chow.auth.fromSocket).mockResolvedValue(translator)
  await chow.redis.set(`auth_${socket.id}`, JSON.stringify(translator))

  return { socket }
}

describe('@join-interpret', () => {
  it('should join the interpreter room', async () => {
    const { socket } = await setup()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('join-interpret', '001', 'fr')

    expect(socket.join).toBeCalledWith('interpret_001_fr')
  })

  it('should tell the client of existing room clients', async () => {
    const { socket } = await setup()

    await chow.redis.set('auth_translator_a', JSON.stringify(translator))
    await chow.redis.set('auth_translator_b', JSON.stringify(translator))
    mocked(chow.getRoomClients).mockResolvedValue([
      'translator_a',
      'translator_b',
    ])

    await socket.emit('join-interpret', '001', 'fr')

    expect(socket.emitBack).toBeCalledTimes(2)
    expect(socket.emitBack).toBeCalledWith('interpret-joined', translatorIsh)
  })

  it('should tell interpret members they joined', async () => {
    const { socket } = await setup()

    await socket.emit('join-interpret', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith(
      'interpret_001_fr',
      'interpret-joined',
      translatorIsh
    )
  })

  it('should log an event', async () => {
    const { socket } = await setup()

    await socket.emit('join-interpret', '001', 'fr')

    expect(logSpy).toBeCalledWith({
      action: 'join-interpret',
      socket: socket.id,
      data: {
        sessionId: '001',
        channel: 'fr',
        email: translator.sub,
      },
    })
  })
})
