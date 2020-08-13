import stopChannelSocket from '../stop-channel'
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

describe('@stop-channel()', () => {
  it('should unset the current translator and their packet', async () => {
    const socket = chow.io()

    const translatorKey = `translator_${socket.id}`

    mocked(chow.auth.fromSocket).mockResolvedValue(translator)
    await chow.redis.set('translator_001_fr', socket.id)
    await chow.redis.set(translatorKey, '001;fr')

    await socket.emit('stop-channel')

    expect(chow.redis.del).toBeCalledWith('translator_001_fr')
    expect(chow.redis.del).toBeCalledWith(translatorKey)
  })
})
