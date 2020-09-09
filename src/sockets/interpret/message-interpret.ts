import { TypedChow } from '../../server'
import createDebug = require('debug')
import { setupInterpretation, getInterpretRoom } from './interpret-utils'
import { LogEvent } from '../../events/log'

const debug = createDebug('api:socket:message-interpret')

export default function messageInterpret(chow: TypedChow) {
  //
  // @message-interpret(sessionId, channel, message)
  //
  chow.socket('message-interpret', async (ctx, sessionId, channel, message) => {
    const { socket, schedule, emitToRoom, emit } = ctx
    debug(`socket="${socket.id}" sessionId="${sessionId}" channel="${channel}"`)

    //
    // Check auth and get the target session
    //
    const { authToken, session } = await setupInterpretation(
      socket.id,
      sessionId,
      channel,
      ctx
    )

    //
    // Work out the room and get the sender's translator record
    //
    const interpretRoom = getInterpretRoom(session.id, channel)
    const translator = await schedule.findTranslator(authToken.sub)
    if (!translator) throw new Error('Bad authentication')

    emitToRoom(interpretRoom, 'interpret-message', translator, message)

    //
    // Log an event
    //
    emit<LogEvent>('log', {
      action: 'message-interpret',
      socket: socket.id,
      data: {
        sessionId,
        channel,
        message,
      },
    })
  })
}
