import { TypedChow } from '../../server'
import createDebug = require('debug')
import { RedisService } from '../../services/redis'
import { getLobbyKey, getLobbyUserSet } from './coffee-chat-utils'

const debug = createDebug('api:socket:join-lobby')

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

function addToLobby(
  redis: RedisService,
  languagePrefs: string[],
  topicPrefs: string[],
  socketId: string
) {
  const promises = []
  for (let lang of languagePrefs) {
    for (let topic of topicPrefs) {
      promises.push(redis.setAdd(getLobbyKey(lang, topic), socketId))
      promises.push(
        redis.setAdd(getLobbyUserSet(socketId), getLobbyKey(lang, topic))
      )
    }
  }
  return Promise.all(promises)
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

export default function joinLobby(chow: TypedChow) {
  chow.socket('join-lobby', async (ctx, languagePrefs, topicPrefs) => {
    const { socket, redis, emitToSocket } = ctx
    debug(
      `socket="${socket.id}" languagePrefs="${languagePrefs}" topicPrefs="${topicPrefs}"`
    )

    const match = await checkForCurrentMatch(redis, languagePrefs, topicPrefs)

    if (match) {
      await removeMatchedUser(redis, match)
      const room = `chat-${socket.id}-${match}`
      emitToSocket(match, 'room-found', room)
      socket.emitBack('room-found', room)
    } else {
      await addToLobby(redis, languagePrefs, topicPrefs, socket.id)
    }
  })
}
