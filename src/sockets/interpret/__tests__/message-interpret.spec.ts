import socket from '../message-interpret'
import {
  TypedMockChow,
  createServer,
  AuthJwt,
  createAuthToken,
  mocked,
} from '../../../test-utils'

let chow: TypedMockChow
let translator: AuthJwt

beforeEach(() => {
  chow = createServer()
  translator = createAuthToken(['translator'])
  socket(chow)
})

async function setup() {
  const socket = chow.io()

  mocked(chow.auth.fromSocket).mockResolvedValue(translator)

  return { socket }
}

describe('@message-interpret', () => {
  it('should broadcast the message to the interpreter room', async () => {
    const { socket } = await setup()

    await socket.emit('message-interpret', '001', 'fr', 'some_test_message')

    expect(chow.emitToRoom).toBeCalledWith(
      'interpret_001_fr',
      'interpret-message',
      {
        slug: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      },
      'some_test_message'
    )
  })
})
