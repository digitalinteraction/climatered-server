import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getUserIceEvent } from './coffee-chat-utils'

const debug = createDebug('api:socket:send-ice')

export default function sendIce(chow: TypedChow) {
  chow.socket('send-ice', async (ctx, room, fromUser, toUser, ice) => {
    const { socket, emitToRoom } = ctx
    debug(
      `socket="${socket.id}" room="${room}" fromUser="${fromUser}" toUser="${toUser}"`
    )

    emitToRoom(room, getUserIceEvent(fromUser, toUser), ice)
  })
}
