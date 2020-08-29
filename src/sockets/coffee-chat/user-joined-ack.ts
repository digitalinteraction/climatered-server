import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getUserJoinedAckEvent } from './coffee-chat-utils'

const debug = createDebug('api:socket:user-joined-ack')

export default function userJoinedAck(chow: TypedChow) {
  chow.socket('user-joined-ack', async (ctx, room, toUser) => {
    const { socket, emitToRoom } = ctx
    debug(`socket="${socket.id}" room="${room}" toUser="${toUser}"`)

    emitToRoom(room, getUserJoinedAckEvent(toUser))
  })
}
