import startChannel from '../start-interpret'
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
  startChannel(chow)
})

describe('@start-interpret(sessionId, channel)', () => {
  it('should mark the translator as current for 6h', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('start-interpret', '001', 'fr')

    expect(chow.redis.setAndExpire).toBeCalledWith(
      'interpreter_001_fr',
      socket.id,
      6 * 60 * 60
    )
  })

  it('should store the translator packet for 6h', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('start-interpret', '001', 'fr')

    const translatorPacket = '001;fr'
    expect(chow.redis.setAndExpire).toBeCalledWith(
      'interpreter_' + socket.id,
      translatorPacket,
      6 * 60 * 60
    )
  })

  it('should kick an existing translator', async () => {
    const socket = chow.io()

    const oldTranslator = `translator_not_${socket.id}`
    mocked(chow.auth.fromSocket).mockResolvedValue(translator)
    await chow.redis.set('interpreter_001_fr', oldTranslator)

    await socket.emit('start-interpret', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith(
      oldTranslator,
      'interpret-takeover',
      {
        slug: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      }
    )
  })

  it('should emit the translator to the interpreter room', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('start-interpret', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith(
      'interpret_001_fr',
      'interpret-started',
      {
        slug: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      }
    )
  })

  it('should emit to the channel room', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('start-interpret', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith('channel_001_fr', 'channel-started')
  })
})
