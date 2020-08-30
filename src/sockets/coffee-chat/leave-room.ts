import { TypedChow } from '../../server'
import createDebug = require('debug')

const debug = createDebug('api:socket:leave-room')

export default function leaveRoom(chow: TypedChow) {
  chow.socket('leave-room', async (ctx, room, user) => {
    const { socket, emitToRoom } = ctx
    debug(`socket="${socket.id}" room="${room}" user="${user}"`)

    socket.leave(room)

    emitToRoom(room, 'user-left', user)
  })
}
