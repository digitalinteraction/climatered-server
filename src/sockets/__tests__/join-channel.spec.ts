import { TypedMockChow, createServer, mocked } from '../../test-utils'
import joinChannelSocket from '../join-channel'

let chow: TypedMockChow

beforeEach(() => {
  chow = createServer()
  joinChannelSocket(chow)
})

describe('@join-channel(eventId, channel)', () => {
  it('should join the socket to the room', async () => {
    const token = chow.jwt.sign({
      typ: 'auth',
      sub: 'user@example.com',
      user_roles: ['attendee'],
      user_lang: 'en',
    })

    const socket = chow.io()

    mocked(chow.users.registrationForSocket).mockResolvedValue({
      name: 'Geoff Testington',
      email: 'user@example.com',
      language: 'en',
      roles: ['attendee'],
    })

    await socket.emit('join-channel', '001', 'fr')

    expect(socket.join).toBeCalledWith('channel-001-fr')
  })
})
