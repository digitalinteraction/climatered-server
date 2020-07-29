import { TypedMockChow, createServer, mocked } from '../../test-utils'
import deauthSocket from '../deauth'

let chow: TypedMockChow

beforeEach(() => {
  chow = createServer()
  deauthSocket(chow)
})

describe('@deauth()', () => {
  it('should remove the redis session', async () => {
    const socket = chow.io()

    await socket.emit('deauth')

    expect(chow.redis.del).toBeCalledWith('auth_' + socket.id)
  })
})
