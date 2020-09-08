import { TypedChow } from '../../server'
import createDebug = require('debug')
import { RedisService } from '../../services/redis'
import { getLobbyKey } from './coffee-chat-utils'

const debug = createDebug('api:socket:query-lobby')

async function queryLobbyTotals(
  redis: RedisService,
  languagePrefs: string[],
  topicPrefs: string[]
) {
  let keys = []
  for (let lang of languagePrefs) {
    for (let topic of topicPrefs) {
      keys.push(getLobbyKey(lang, topic))
    }
  }
  return redis.setUnionStore('lobby-query', keys)
}

export default function queryLobby(chow: TypedChow) {
  chow.socket('query-lobby', async (ctx, languagePrefs, topicPrefs) => {
    const { socket, redis } = ctx
    debug(
      `socket="${socket.id}" languagePrefs="${languagePrefs}" topicPrefs="${topicPrefs}"`
    )
    const count = await queryLobbyTotals(redis, languagePrefs, topicPrefs)
    socket.emitBack('lobby-count', count)
  })
}
