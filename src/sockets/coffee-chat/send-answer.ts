import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getUserAnswerEvent, getRoom } from './coffee-chat-utils'

const debug = createDebug('api:socket:send-answer')

export default function sendAnswer(chow: TypedChow) {
  chow.socket('send-answer', async (ctx, room, fromUser, toUser, answer) => {
    const { socket, emitToRoom } = ctx
    debug(
      `socket="${socket.id}" room="${room}" fromUser="${fromUser}" toUser="${toUser}"`
    )

    emitToRoom(getRoom(room), getUserAnswerEvent(fromUser, toUser), answer)
  })
}
