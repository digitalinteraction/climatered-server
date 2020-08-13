import startChannel from '../start-channel'
import {
  TypedMockChow,
  createServer,
  mocked,
  AuthJwt,
  createAuthToken,
} from '../../../test-utils'

let chow: TypedMockChow
let translator: AuthJwt

const sixHours = 6 * 60 * 60

beforeEach(() => {
  chow = createServer()
  translator = createAuthToken(['translator'])
  startChannel(chow)
})

describe('@start-channel(sessionId, channel)', () => {
  it('should mark the translator as current', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('start-channel', '001', 'fr')

    expect(chow.redis.setAndExpire).toBeCalledWith(
      'translator_001_fr',
      socket.id,
      sixHours
    )
  })

  it('should store the translator packet', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('start-channel', '001', 'fr')

    const translatorPacket = '001;fr'
    expect(chow.redis.setAndExpire).toBeCalledWith(
      'translator_' + socket.id,
      translatorPacket,
      sixHours
    )
  })

  it('should tell the existing translator to stop', async () => {
    const socket = chow.io()

    const oldTranslator = `translator_not_${socket.id}`
    mocked(chow.auth.fromSocket).mockResolvedValue(translator)
    await chow.redis.set('translator_001_fr', oldTranslator)

    await socket.emit('start-channel', '001', 'fr')

    expect(chow.redis.del).toBeCalledWith(`translator_${socket.id}`)
    expect(chow.emitToRoom).toBeCalledWith(oldTranslator, 'channel-takeover')
  })
})
