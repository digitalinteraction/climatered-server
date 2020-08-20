import { TypedChow } from '../../server'
import { ChannelStruct, isStruct } from '../../structs'
import createDebug = require('debug')
import { getChannelRoom } from '../interpret/interpret-utils'

const debug = createDebug('api:socket:leave-channel')

export default function leaveChannel(chow: TypedChow) {
  //
  // @leave-channel(sessionId, channel)
  //
  chow.socket('leave-channel', async (ctx, sessionId, channel) => {
    const {
      socket,
      schedule,
      sendError,
      auth,
      getRoomClients,
      emitToRoom,
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
    const authToken = await auth.fromSocket(socket.id)
    if (!authToken) return sendError('Bad auth')

    //
    // Find the session to unsubscribe from
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
    // If all assetions passed so far, remove them from the channel
    //
    const room = getChannelRoom(session.id, channel)
    socket.leave(room)

    //
    // Broadcast the new room occupancy
    //
    const clients = await getRoomClients([room])
    emitToRoom(room, 'channel-occupancy', clients.length)
  })
}
