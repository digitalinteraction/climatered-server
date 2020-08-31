import { TypedChow } from '../../server'
import createDebug = require('debug')

const debug = createDebug('api:socket:join-room')

export default function joinRoom(chow: TypedChow) {
  chow.socket('join-room', async (ctx, room, user) => {
    const { socket, emitToRoom } = ctx
    debug(`socket="${socket.id}" room="${room}" user="${user}"`)

    socket.join(room)

    emitToRoom(room, 'user-joined', user)
  })
}
