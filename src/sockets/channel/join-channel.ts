import { TypedChow } from '../../server'
import { ChannelStruct, isStruct } from '../../structs'
import createDebug = require('debug')
import { getChannelRoom, getActiveKey } from '../interpret/interpret-utils'

const debug = createDebug('api:socket:join-channel')

export default function joinChannel(chow: TypedChow) {
  //
  // @join-channel(sessionId, channel)
  //
  chow.socket('join-channel', async (ctx, sessionId, channel) => {
    const {
      socket,
      schedule,
      auth,
      sendError,
      emitToRoom,
      getRoomClients,
      redis,
    } = ctx

    debug(`socket="${socket.id}" sessionId="${sessionId}" channel="${channel}"`)

    //
    // Ensure the correct arguments were passed up
    //
    if (typeof sessionId !== 'string' || typeof channel !== 'string') {
      return sendError('Invalid socket arguments')
    }

    //
    // Check the socket's authentication
    //
    const token = await auth.fromSocket(socket.id)
    if (!token) return sendError('Bad auth')

    //
    // Find the session they want to subscribe to
    //
    const session = await schedule.findSession(sessionId)
    if (
      !session ||
      !session.enableTranslation ||
      !isStruct(channel, ChannelStruct)
    ) {
      return sendError('Session not found')
    }

    //
    // If they passed all checks, subscribe them for audio
    //
    const room = getChannelRoom(session.id, channel)
    socket.join(room)

    //
    // Emit the room size to everyone in it
    //
    const clients = await getRoomClients([room])
    emitToRoom(room, 'channel-occupancy', clients.length)

    //
    // If there is an active interpreter, let the new joiner know
    //
    const activeKey = getActiveKey(sessionId, channel)
    const active = await redis.get(activeKey)
    if (active) emitToRoom(socket.id, 'channel-started')
  })
}
