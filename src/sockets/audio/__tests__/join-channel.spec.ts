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

    expect(socket.join).toBeCalledWith('channel-001-fr')
  })
})
