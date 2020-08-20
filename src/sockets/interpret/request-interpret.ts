import { TypedChow } from '../../server'
import createDebug = require('debug')
import { setupInterpretation, getInterpretRoom } from './interpret-utils'

const debug = createDebug('api:socket:request-interpret')

export default function requestInterpret(chow: TypedChow) {
  //
  // request-interpret(sessionId, channel, duration)
  //
  chow.socket(
    'request-interpret',
    async (ctx, sessionId, channel, duration) => {
      const { socket, emitToRoom, schedule } = ctx
      debug(
        `socket="${socket.id}" sessionId="${sessionId}" channel="${channel}"`
      )

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
      if (!translator) throw new Error('Bad auth')

      //
      // Broadcast to other interpreters
      //
      const interpretRoom = getInterpretRoom(session.id, channel)
      emitToRoom(interpretRoom, 'interpret-requested', translator, duration)
    }
  )
}
