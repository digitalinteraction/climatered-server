import { TypedChow } from '../../server'
import createDebug = require('debug')
import { removeMatchedUser } from './coffee-chat-utils'

const debug = createDebug('api:socket:leave-lobby')

export default function leaveLobby(chow: TypedChow) {
  chow.socket('leave-lobby', async (ctx, languagePrefs, topicPrefs) => {
    const { socket, redis } = ctx
    debug(
      `socket="${socket.id}" languagePrefs="${languagePrefs}" topicPrefs="${topicPrefs}"`
    )
    await removeMatchedUser(redis, socket.id)
    socket.emitBack('left-lobby')
  })
}
