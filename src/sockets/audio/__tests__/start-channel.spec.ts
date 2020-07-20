import startChannel from '../start-channel'
import {
  TypedMockChow,
  createServer,
  mocked,
  createRegistration,
  Registration,
} from '../../../test-utils'

let chow: TypedMockChow
let translator: Registration

beforeEach(() => {
  chow = createServer()
  translator = createRegistration(['translator'])
  startChannel(chow)
})

describe('@start-channel(eventId, channel)', () => {
  it('should mark the translator as current', async () => {
    const socket = chow.io()

    mocked(chow.users.registrationForSocket).mockResolvedValue(translator)

    await socket.emit('start-channel', '001', 'fr')

    expect(chow.redis.set).toBeCalledWith('translator_001_fr', socket.id)
  })

  it('should store the translator packet', async () => {
    const socket = chow.io()

    mocked(chow.users.registrationForSocket).mockResolvedValue(translator)

    await socket.emit('start-channel', '001', 'fr')

    const translatorPacket = '001;fr'
    expect(chow.redis.set).toBeCalledWith(
      'translator_' + socket.id,
      translatorPacket
    )
  })

  it('should tell the existing translator to stop', async () => {
    const socket = chow.io()

    const oldTranslator = `translator_not_${socket.id}`
    mocked(chow.users.registrationForSocket).mockResolvedValue(translator)
    await chow.redis.set('translator_001_fr', oldTranslator)

    await socket.emit('start-channel', '001', 'fr')

    expect(chow.redis.del).toBeCalledWith(`translator_${socket.id}`)
    expect(chow.emitToRoom).toBeCalledWith(oldTranslator, 'channel-takeover')
  })
})
