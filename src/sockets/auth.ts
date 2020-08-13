import { TypedChow } from '../server'
import { AuthJwt } from '../services/jwt'
import createDebug = require('debug')

const debug = createDebug('api:socket:auth')

export default function auth(chow: TypedChow) {
  //
  // @auth(token)
  //
  chow.socket('auth', async (ctx, token = '') => {
    const { socket, jwt, redis, sendError } = ctx

    debug(`socket="${socket.id}" token="${token}"`)

    try {
      const auth = jwt.verify(token) as AuthJwt

      if (typeof auth !== 'object' || auth.typ !== 'auth') {
        debug('invalid auth')
        throw new Error('Bad auth')
      }

      //
      // THOUGHT – store the jwt here, or just JSON encode it?
      // - is it easier to jwt.decode or JSON.parse the info on the other side
      //
      redis.set('auth_' + socket.id, JSON.stringify(auth))

      debug('valid auth')
      return true
    } catch (error) {
      sendError('Bad auth')
      return false
    }
  })
}
