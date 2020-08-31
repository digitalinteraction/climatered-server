import sendToChannelSocket from '../send-interpret'
import { TypedMockChow, createServer } from '../../../test-utils'

let chow: TypedMockChow

beforeEach(() => {
  chow = createServer()
  sendToChannelSocket(chow)
})

describe('@send-interpret(rawData)', () => {
  it('should emit the date to that room', async () => {
    const socket = chow.io()

    await chow.redis.set(`interpreter_${socket.id}`, '001;fr')

    const rawData = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    await socket.emit('send-interpret', rawData)

    expect(chow.emitToRoom).toBeCalledWith(
      'channel_001_fr',
      'channel-data',
      rawData
    )
  })

  it('should lengthen the expire on the translator lock', async () => {
    const socket = chow.io()

    await chow.redis.set(`interpreter_${socket.id}`, '001;fr')

    const rawData = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    await socket.emit('send-interpret', rawData)

    expect(chow.redis.expire).toBeCalledWith('interpreter_001_fr', 5 * 60)
  })
})
