import sendToChannelSocket from '../send-interpret'
import { TypedMockChow, createServer } from '../../../test-utils'

let chow: TypedMockChow
let payload: any
let putObject: jest.Mock
let logSpy: jest.Mock

beforeEach(() => {
  payload = {
    sampleRate: 16000,
    arrayBuffer: new ArrayBuffer(16),
  }

  chow = createServer()
  putObject = jest.fn()
  sendToChannelSocket(chow)

  chow.event('put-object', (ctx) => putObject(ctx.event.payload))

  logSpy = chow.spyEvent('log')
})

describe('@send-interpret(rawData)', () => {
  it('should emit the date to that room', async () => {
    const socket = chow.io()

    await chow.redis.set(`interpreter_${socket.id}`, '001;fr')

    await socket.emit('send-interpret', payload)

    expect(chow.emitToRoom).toBeCalledWith(
      'channel_001_fr',
      'channel-data',
      payload
    )
  })

  it('should lengthen the expire on the translator lock', async () => {
    const socket = chow.io()

    await chow.redis.set(`interpreter_${socket.id}`, '001;fr')

    await socket.emit('send-interpret', payload)

    expect(chow.redis.expire).toBeCalledWith('interpreter_001_fr', 5 * 60)
  })

  it('should upload the buffer to s3', async () => {
    const socket = chow.io()

    await chow.redis.set(`interpreter_${socket.id}`, '001;fr')

    await socket.emit('send-interpret', payload)

    expect(putObject).toBeCalledWith({
      key: expect.stringMatching(/^interpret\/001\/fr\/\d+.pcm$/),
      body: expect.any(Buffer),
      acl: 'private',
    })
  })

  it('should log an event', async () => {
    const socket = chow.io()

    await chow.redis.set(`interpreter_${socket.id}`, '001;fr')

    await socket.emit('send-interpret', payload)

    expect(logSpy).toBeCalledWith({
      action: 'send-interpret',
      socket: socket.id,
      data: {
        sessionId: '001',
        channel: 'fr',
        timestamp: expect.any(Number),
      },
    })
  })
})
