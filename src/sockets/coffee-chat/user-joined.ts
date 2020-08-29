import { TypedChow } from '../../server'
import createDebug = require('debug')

const debug = createDebug('api:socket:user-joined')

export default function userJoined(chow: TypedChow) {
  chow.socket('join-lobby', async (ctx, room, user) => {
    const { socket, emitToRoom } = ctx
    debug(`socket="${socket.id}" room="${room}" user="${user}"`)

    emitToRoom(room, 'user-joined', user)
  })
}
