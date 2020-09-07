import { TypedChow } from '../../server'
import createDebug = require('debug')
import { getRoom } from './coffee-chat-utils'

const debug = createDebug('api:socket:join-room')

export default function joinRoom(chow: TypedChow) {
  chow.socket('join-room', async (ctx, room, user) => {
    const { socket, emitToRoom } = ctx
    debug(`socket="${socket.id}" room="${room}" user="${user}"`)

    socket.join(getRoom(room))

    emitToRoom(getRoom(room), 'user-joined', user)
  })
}
