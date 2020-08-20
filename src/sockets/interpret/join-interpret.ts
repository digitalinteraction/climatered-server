import { TypedChow, Context } from '../../server'
import { Translator } from '../../structs'
import createDebug = require('debug')
import {
  setupInterpretation,
  getInterpretRoom,
  getActiveKey,
} from './interpret-utils'
import { AuthJwt } from '../../test-utils'

const debug = createDebug('api:socket:join-interpret')

async function translatorFinder(ctx: Context) {
  const translators = new Map<string, Translator>()
  for (const t of await ctx.schedule.getTranslators()) {
    translators.set(t.email, t)
  }

  return async (socketId: string) => {
    const auth = await ctx.redis.getJson<AuthJwt | null>(
      'auth_' + socketId,
      null
    )

    if (!auth) return null

    const translator = translators.get(auth.sub)

    if (!translator) return null

    return translator
  }
}

export default function joinInterpret(chow: TypedChow) {
  //
  // @join-interpret(sessionId, channel)
  //
  chow.socket('join-interpret', async (ctx, sessionId, channel) => {
    const { socket, emitToRoom, getRoomClients, redis } = ctx
    debug(`socket="${socket.id}" sessionId="${sessionId}" channel="${channel}"`)

    //
    // Validate auth and target session
    //
    const { session } = await setupInterpretation(
      socket.id,
      sessionId,
      channel,
      ctx
    )
    const interpretRoom = getInterpretRoom(session.id, channel)

    //
    // Precompute a method for finding translators
    //
    const translatorForSocket = await translatorFinder(ctx)

    const self = await translatorForSocket(socket.id)
    if (!self) throw new Error('Bad authentication')

    //
    // Before joining the room, let the sender know who's already there
    //
    for (const client of await getRoomClients([interpretRoom])) {
      const translator = await translatorForSocket(client)
      if (!translator) continue
      socket.emitBack('interpret-joined', translator)
    }

    //
    // Join the interpret room
    //
    socket.join(interpretRoom)

    //
    // Let all sockets know someone joined (including the sender)
    //
    emitToRoom(interpretRoom, 'interpret-joined', self)

    //
    // If there is an active translator, send that to the new client
    //
    const activeKey = getActiveKey(session.id, channel)
    const active = await redis.get(activeKey)
    if (active) {
      const translator = await translatorForSocket(active)
      if (translator) {
        socket.emitBack('interpret-started', translator)
      }
    }
  })
}
