import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getRoom } from './coffee-chat-utils'

const debug = createDebug('api:socket:leave-room')

export default function leaveRoom(chow: TypedChow) {
  chow.socket('leave-room', async (ctx, room, user) => {
    const { socket, emitToRoom } = ctx
    debug(`socket="${socket.id}" room="${room}" user="${user}"`)

    socket.leave(getRoom(room))

    emitToRoom(getRoom(room), 'user-left', user)
  })
}
