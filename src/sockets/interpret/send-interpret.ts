import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getPacketKey, getChannelRoom, getActiveKey } from './interpret-utils'

const thirtySeconds = 30

const debug = createDebug('api:socket:send-interpret')

export default function sendInterpret(chow: TypedChow) {
  //
  // @send-interpret(rawData)
  //
  chow.socket('send-interpret', async (ctx, rawData) => {
    const { sendError, emitToRoom, socket, redis } = ctx

    //
    // Get their translator packet to check they are allowed to broadcast
    // and to tell them who to broadcast to
    //
    const packet = await redis.get(getPacketKey(socket.id))
    if (!packet) return sendError('Bad auth')

    //
    // Reconstruct the key to emit to based on the packet
    //
    const [sessionId, channel] = packet.split(';')
    const room = getChannelRoom(sessionId, channel)
    debug(`socket="${socket.id}" room="${room}"`)

    //
    // Emit the raw data to the room
    //
    emitToRoom(room, 'channel-data', rawData)

    //
    // Refresh the translator packet
    //
    const activeKey = getActiveKey(sessionId, channel)
    await redis.expire(activeKey, thirtySeconds)
  })
}
