import { TypedChow } from '../server'
import createDebug = require('debug')

const debug = createDebug('api:socket:deauth')

export default function deauth(chow: TypedChow) {
  //
  // @deauth()
  //
  chow.socket('deauth', async (ctx) => {
    const { socket, jwt, redis } = ctx

    debug(`socket="${socket.id}"`)

    await redis.del('auth_' + socket.id)
  })
}
