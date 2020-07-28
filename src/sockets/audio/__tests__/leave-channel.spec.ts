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

beforeEach(() => {
  chow = createServer()
  attendee = createAuthToken(['attendee'])
  leaveChannelSocket(chow)
})

describe('@leave-channel(sessionId', () => {
  it('should remove that user from the channel', async () => {
    const socket = chow.io()

    mocked(chow.auth.fromSocket).mockResolvedValue(attendee)

    await socket.emit('leave-channel', '001', 'fr')

    expect(socket.leave).toBeCalledWith('channel-001-fr')
  })
})
