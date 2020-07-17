import { TypedChow } from '../server'
import { AuthJwt } from '../services/jwt'

export default function auth(chow: TypedChow) {
  //
  // auth(token)
  //
  chow.socket('auth', async ({ socket, jwt, redis }, token = '') => {
    const auth = jwt.verify(token) as AuthJwt

    if (typeof auth !== 'object' || auth.typ !== 'auth') {
      //  send error?
      return
    }

    //
    // THOUGHT – store the jwt here, or just JSON encode it?
    //
    redis.set('auth_' + socket.id, JSON.stringify(auth))
  })
}
