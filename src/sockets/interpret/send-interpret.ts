import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getPacketKey, getChannelRoom, getActiveKey } from './interpret-utils'
import { S3Event } from '../../events/put-object'

const fiveMinsInSeconds = 5 * 60

const debug = createDebug('api:socket:send-interpret')

export default function sendInterpret(chow: TypedChow) {
  //
  // @send-interpret(rawData)
  //
  chow.socket('send-interpret', async (ctx, rawData) => {
    const { sendError, emitToRoom, socket, redis, emit } = ctx

    //
    // Get their translator packet to check they are allowed to broadcast
    // and to tell them who to broadcast to
    //
    const packet = await redis.get(getPacketKey(socket.id))
    if (!packet) {
      sendError('Bad auth')
      return false
    }

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
    await redis.expire(activeKey, fiveMinsInSeconds)

    const cleanId = sessionId.trim().replace(/\s+/, '').toLowerCase()
    emit<S3Event>('put-object', {
      key: `interpret/${cleanId}/${channel}/${new Date().getTime()}.pcm`,
      body: Buffer.from(rawData.arrayBuffer),
      acl: 'private',
    })

    return true
  })
}
