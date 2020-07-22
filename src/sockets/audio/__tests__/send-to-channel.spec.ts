import sendToChannelSocket from '../send-to-channel'
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
  sendToChannelSocket(chow)
})

describe('@send-to-channel(rawData)', () => {
  it('should emit the date to that room', async () => {
    const socket = chow.io()

    await chow.redis.set(`translator_${socket.id}`, '001;fr')

    const rawData = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    await socket.emit('send-to-channel', rawData)

    expect(chow.emitToRoom).toBeCalledWith(
      'channel-001-fr',
      'channel-data',
      rawData
    )
  })
})
