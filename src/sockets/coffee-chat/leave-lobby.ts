import { TypedChow } from '../../server'
import createDebug = require('debug')
import { RedisService } from '../../services/redis'
import { getLobbyKey, getLobbyUserSet } from './coffee-chat-utils'

const debug = createDebug('api:socket:leave-lobby-options')

async function checkForCurrentMatch(
  redis: RedisService,
  languagePrefs: string[],
  topicPrefs: string[]
) {
  for (let lang of languagePrefs) {
    for (let topic of topicPrefs) {
      const matchedUser = await redis.setPop(getLobbyKey(lang, topic))
      if (matchedUser) return matchedUser
    }
  }
  return null
}

async function removeMatchedUser(redis: RedisService, socketId: string) {
  const promises = []
  const inLobby = await redis.setMembers(`inlobby-${socketId}`)
  for (let lobby of inLobby) {
    promises.push(redis.setRemove(lobby, socketId))
    promises.push(redis.setRemove(getLobbyUserSet(socketId), lobby))
  }
  return Promise.all(promises)
}

export default function updateLobbyOptions(chow: TypedChow) {
  chow.socket('leave-lobby', async (ctx, languagePrefs, topicPrefs) => {
    const { socket, redis, emitToSocket } = ctx
    debug(
      `socket="${socket.id}" languagePrefs="${languagePrefs}" topicPrefs="${topicPrefs}"`
    )
    const match = await checkForCurrentMatch(redis, languagePrefs, topicPrefs)
    await removeMatchedUser(redis, socket.id)
    socket.emitBack('left-lobby')
  })
}
