import socket from '../join-room'
import {
  TypedMockChow,
  createServer,
  AuthJwt,
  createAuthToken,
  mocked,
} from '../../../test-utils'

let chow: TypedMockChow
let attendee: AuthJwt

beforeEach(() => {
  chow = createServer()
  attendee = createAuthToken(['attendee'])
  socket(chow)
})

describe('@join-room', () => {
  it('should join the room', async () => {
    const socket = chow.io()

    const user = {}
    await socket.emit('join-room', 'some-room', user)

    expect(socket.join).toBeCalledWith('chat-some-room')
  })

  it('should emit the user to participants of that room', async () => {
    const socket = chow.io()

    const user = {}
    await socket.emit('join-room', 'some-room', user)

    expect(chow.emitToRoom).toBeCalledWith(
      'chat-some-room',
      'user-joined',
      user
    )
  })
})
