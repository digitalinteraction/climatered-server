import { TypedChow } from '../../server'
import createDebug = require('debug')

const debug = createDebug('api:socket:join-lobby')

export default function joinLobby(chow: TypedChow) {
  chow.socket('join-lobby', async (ctx, languagePrefs, topicPrefs) => {
    const { socket } = ctx
    debug(
      `socket="${socket.id}" languagePrefs="${languagePrefs}" topicPrefs="${topicPrefs}"`
    )

    // TODO: Push onto lobby queue

    socket.emitBack('lobby-joined', { numOnline: 10 })
  })
}
