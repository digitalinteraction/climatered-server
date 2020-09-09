import { TypedChow } from '../server'
import { AuthJwt } from '../services/jwt'
import { LogEvent } from '../events/log'
import createDebug = require('debug')

const debug = createDebug('api:socket:auth')
const sixHours = 6 * 60 * 60

export default function auth(chow: TypedChow) {
  //
  // @auth(token)
  //
  chow.socket('auth', async (ctx, token = '') => {
    const { socket, jwt, redis, sendError, emit, users } = ctx

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
      redis.setAndExpire('auth_' + socket.id, JSON.stringify(auth), sixHours)

      //
      // Log an event
      //
      const attendee = await users.getRegistration(auth.sub, true)
      emit<LogEvent>('log', {
        action: 'auth',
        socket: socket.id,
        attendee: attendee?.id,
        data: {},
      })

      debug('valid auth')
      return true
    } catch (error) {
      sendError('Bad auth')
      return false
    }
  })
}
