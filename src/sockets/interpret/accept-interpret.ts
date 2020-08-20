import { TypedChow } from '../../server'
import createDebug = require('debug')
import { setupInterpretation, getInterpretRoom } from './interpret-utils'

const debug = createDebug('api:socket:accept-interpret')

export default function acceptInterpret(chow: TypedChow) {
  //
  // accept-interpret(sessionId, channel)
  //
  chow.socket('accept-interpret', async (ctx, sessionId, channel) => {
    const { socket, emitToRoom, schedule } = ctx
    debug(`socket="${socket.id}" sessionId="${sessionId}" channel="${channel}"`)

    //
    // Check auth and get the session
    //
    const { authToken, session } = await setupInterpretation(
      socket.id,
      sessionId,
      channel,
      ctx
    )

    //
    // Grab their translator record
    //
    const translator = await schedule.findTranslator(authToken.sub)
    if (!translator) throw new Error('Bad authentication')

    //
    // Broadcast to other interpreters
    //
    const interpretRoom = getInterpretRoom(session.id, channel)
    emitToRoom(interpretRoom, 'interpret-accepted', translator)
  })
}
