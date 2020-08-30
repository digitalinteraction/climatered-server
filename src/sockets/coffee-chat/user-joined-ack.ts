import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getUserAckEvent } from './coffee-chat-utils'

const debug = createDebug('api:socket:user-joined-ack')

export default function userJoinedAck(chow: TypedChow) {
  chow.socket('user-ack', async (ctx, room, fromUser, toUser) => {
    const { socket, emitToRoom } = ctx
    debug(
      `socket="${socket.id}" room="${room}" fromUser="${fromUser}" toUser="${toUser}"`
    )

    emitToRoom(room, getUserAckEvent(toUser), fromUser)
  })
}
