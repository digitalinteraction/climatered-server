import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getUserAckEvent, getRoom } from './coffee-chat-utils'

const debug = createDebug('api:socket:user-ack')

export default function userJoinedAck(chow: TypedChow) {
  chow.socket('user-ack', async (ctx, room, fromUser, toUser) => {
    const { socket, emitToRoom } = ctx
    debug(
      `socket="${socket.id}" room="${room}" fromUser="${fromUser}" toUser="${toUser}"`
    )

    emitToRoom(getRoom(room), getUserAckEvent(toUser), fromUser)
  })
}
