import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getUserOfferEvent, getRoom } from './coffee-chat-utils'

const debug = createDebug('api:socket:send-offer')

export default function sendOffer(chow: TypedChow) {
  chow.socket('send-offer', async (ctx, room, fromUser, toUser, offer) => {
    const { socket, emitToRoom } = ctx
    debug(
      `socket="${socket.id}" room="${room}" fromUser="${fromUser}" toUser="${toUser}"`
    )

    emitToRoom(getRoom(room), getUserOfferEvent(fromUser, toUser), offer)
  })
}
