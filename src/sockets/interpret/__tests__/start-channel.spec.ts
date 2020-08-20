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

beforeEach(() => {
  chow = createServer()
  translator = createAuthToken(['translator'])
  startChannel(chow)
})

describe('@start-channel(sessionId, channel)', () => {
  it('should mark the translator as current for 30s', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('start-channel', '001', 'fr')

    expect(chow.redis.setAndExpire).toBeCalledWith(
      'translator_001_fr',
      socket.id,
      30
    )
  })

  it('should store the translator packet for 6h', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)

    await socket.emit('start-channel', '001', 'fr')

    const translatorPacket = '001;fr'
    expect(chow.redis.setAndExpire).toBeCalledWith(
      'translator_' + socket.id,
      translatorPacket,
      6 * 60 * 60
    )
  })

  it('should return false if there is already a translator', async () => {
    const socket = chow.io()

    const oldTranslator = `translator_not_${socket.id}`
    mocked(chow.auth.fromSocket).mockResolvedValue(translator)
    await chow.redis.set('translator_001_fr', oldTranslator)

    const response = await socket.emit('start-channel', '001', 'fr')

    expect(response).toEqual(false)
  })
})
