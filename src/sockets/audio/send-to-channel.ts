import { TypedChow } from '../../server'
import createDebug = require('debug')

const thirtySeconds = 30

const debug = createDebug('api:socket:send-to-channel')

export default function sendToChannel(chow: TypedChow) {
  //
  // @send-to-channel(rawData)
  //
  chow.socket('send-to-channel', async (ctx, rawData) => {
    const { sendError, emitToRoom, socket, redis } = ctx

    //
    // Get their translator packet to check they are allowed to broadcast
    // and to tell them who to broadcast to
    //
    const packet = await redis.get(`translator_${socket.id}`)
    if (!packet) return sendError('Bad auth')

    //
    // Reconstruct the key to emit to based on the packet
    //
    const [sessionId, channel] = packet.split(';')
    const key = `channel-${sessionId}-${channel}`
    debug(`socket="${socket.id}" room="${key}"`)

    //
    // Emit the raw data to the room
    //
    emitToRoom(key, 'channel-data', rawData)

    //
    // Refresh the translator packet
    //
    const channelKey = `translator_${sessionId}_${channel}`
    await redis.expire(channelKey, thirtySeconds)
  })
}
