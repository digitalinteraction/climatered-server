import { RedisService } from '../../services/redis'

export function getLobbyKey(lang: string, topic: string) {
  return `${lang}-${topic}`
}

export function getLobbyUserSet(socketId: string) {
  return `inlobby-${socketId}`
}

export function getUserAckEvent(toUser: string) {
  return `user-ack-${toUser}`
}

export function getUserOfferEvent(fromUser: string, toUser: string) {
  return `offer-${fromUser}-${toUser}`
}

export function getUserAnswerEvent(fromUser: string, toUser: string) {
  return `answer-${fromUser}-${toUser}`
}

export function getUserIceEvent(fromUser: string, toUser: string) {
  return `ice-${fromUser}-${toUser}`
}

export async function removeMatchedUser(redis: RedisService, socketId: string) {
  const promises = []
  const inLobby = await redis.setMembers(`inlobby-${socketId}`)
  for (let lobby of inLobby) {
    promises.push(redis.setRemove(lobby, socketId))
    promises.push(redis.setRemove(getLobbyUserSet(socketId), lobby))
  }
  return Promise.all(promises)
}
