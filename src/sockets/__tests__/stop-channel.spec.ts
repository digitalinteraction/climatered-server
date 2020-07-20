import {
  TypedMockChow,
  createServer,
  mocked,
  createRegistration,
} from '../../test-utils'
import stopChannelSocket from '../stop-channel'
import { Registration } from '../../services/users'

let chow: TypedMockChow
let translator: Registration

beforeEach(() => {
  chow = createServer()
  translator = createRegistration(['translator'])
  stopChannelSocket(chow)
})

describe('@stop-channel()', () => {
  it('should unset the current translator and their packet', async () => {
    const socket = chow.io()

    const translatorKey = `translator_${socket.id}`

    mocked(chow.users.registrationForSocket).mockResolvedValue(translator)
    await chow.redis.set('translator_001_fr', socket.id)
    await chow.redis.set(translatorKey, '001;fr')

    await socket.emit('stop-channel')

    expect(chow.redis.del).toBeCalledWith('translator_001_fr')
    expect(chow.redis.del).toBeCalledWith(translatorKey)
  })
})
