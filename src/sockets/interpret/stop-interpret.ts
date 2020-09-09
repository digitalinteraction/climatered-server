import { TypedChow } from '../../server'
import createDebug = require('debug')
import {
  setupInterpretation,
  getPacketKey,
  getChannelRoom,
  getActiveKey,
  getInterpretRoom,
} from './interpret-utils'
import { LogEvent } from '../../events/log'

const debug = createDebug('api:socket:stop-interpret')

export default function stopChannel(chow: TypedChow) {
  //
  // @stop-interpret()
  //
  chow.socket('stop-interpret', async (ctx) => {
    const { socket, sendError, redis, auth, emitToRoom, schedule, emit } = ctx
    debug(`socket="${socket.id}"`)

    //
    // Check they're authed first
    //
    const user = await auth.fromSocket(socket.id)
    if (!user || !user.user_roles.includes('translator')) {
      return sendError('Bad authentication')
    }

    //
    // Get their translator record
    //
    const translator = await schedule.findTranslator(user.sub)
    if (!translator) return sendError('Bad authentication')

    //
    // Get their data packet
    //
    const packetKey = getPacketKey(socket.id)
    debug(`packetKey="${packetKey}"`)

    const packet = await redis.get(packetKey)
    if (!packet) return sendError('Bad authentication')

    //
    // Unpack the packet
    //
    const [sessionId, channel] = packet.split(';')
    const activeKey = getActiveKey(sessionId, channel)

    //
    // Remove the sender as active interpreter
    //
    debug(`sessionId="${sessionId}" channel="${channel}"`)
    await redis.del(activeKey)

    //
    // Unstore the data packet (also expires after 6 hours)
    //
    await redis.del(packetKey)

    //
    // Broadcast to the channel
    //
    const channelRoom = getChannelRoom(sessionId, channel)
    emitToRoom(channelRoom, 'channel-stopped')

    //
    // Broadcast to interpreters
    //
    const interpretRoom = getInterpretRoom(sessionId, channel)
    emitToRoom(interpretRoom, 'interpret-stopped', translator)

    //
    // Log an event
    //
    emit<LogEvent>('log', {
      action: 'stop-interpret',
      socket: socket.id,
      data: {
        sessionId,
        channel,
      },
    })
  })
}
