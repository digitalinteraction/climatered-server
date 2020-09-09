import leaveChannelSocket from '../leave-channel'
import {
  TypedMockChow,
  createServer,
  mocked,
  createAuthToken,
  AuthJwt,
} from '../../../test-utils'

let chow: TypedMockChow
let attendee: AuthJwt
let logSpy: jest.Mock

beforeEach(() => {
  chow = createServer()
  attendee = createAuthToken(['attendee'])
  leaveChannelSocket(chow)

  logSpy = chow.spyEvent('log')
})

describe('@leave-channel(sessionId', () => {
  it('should remove that user from the channel', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(attendee)

    await socket.emit('leave-channel', '001', 'fr')

    expect(socket.leave).toBeCalledWith('channel_001_fr')
  })
  it('should broadcast the new channel occupancy', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(attendee)
    mocked(chow.getRoomClients).mockResolvedValue(['client-a', 'client-b'])

    await socket.emit('leave-channel', '001', 'fr')

    expect(chow.emitToRoom).toBeCalledWith(
      'channel_001_fr',
      'channel-occupancy',
      2
    )
  })
  it('should log an event', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(attendee)

    await socket.emit('leave-channel', '001', 'fr')

    expect(logSpy).toBeCalledWith({
      action: 'leave-channel',
      socket: socket.id,
      attendee: expect.any(Number),
      data: {
        sessionId: '001',
        channel: 'fr',
      },
    })
  })
})
