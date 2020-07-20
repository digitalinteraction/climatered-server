import joinChannelSocket from '../join-channel'
import {
  TypedMockChow,
  createServer,
  mocked,
  createRegistration,
  Registration,
} from '../../../test-utils'

let chow: TypedMockChow
let attendee: Registration

beforeEach(() => {
  chow = createServer()
  attendee = createRegistration(['attendee'])
  joinChannelSocket(chow)
})

describe('@join-channel(eventId, channel)', () => {
  it('should join the socket to the room', async () => {
    const socket = chow.io()

    mocked(chow.users.registrationForSocket).mockResolvedValue(attendee)

    await socket.emit('join-channel', '001', 'fr')

    expect(socket.join).toBeCalledWith('channel-001-fr')
  })
})
