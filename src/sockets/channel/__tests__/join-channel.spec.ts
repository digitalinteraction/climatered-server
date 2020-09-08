import joinChannelSocket from '../join-channel'
import {
  TypedMockChow,
  createServer,
  mocked,
  createAuthToken,
  AuthJwt,
} from '../../../test-utils'

let chow: TypedMockChow
let attendee: AuthJwt

beforeEach(() => {
  chow = createServer()
  attendee = createAuthToken(['attendee'])
  joinChannelSocket(chow)
})

describe('@join-channel(sessionId, channel)', () => {
  it('should join the socket to the room', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(attendee)

    await socket.emit('join-channel', '001', 'fr')

    expect(socket.join).toBeCalledWith('channel_001_fr')
  })

  it('should emit the channel count upon entering', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(attendee)
    mocked(chow.getRoomClients).mockResolvedValue([
      'socket-id-a',
      'socket-id-b',
      'socket-id-c',
    ])

    await socket.emit('join-channel', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith(
      'channel_001_fr',
      'channel-occupancy',
      3
    )
  })

  it('should emit a channel-started if already active', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(attendee)
    await chow.redis.set('interpreter_001_fr', 'some-long-id')

    await socket.emit('join-channel', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith(socket.id, 'channel-started')
  })
})
