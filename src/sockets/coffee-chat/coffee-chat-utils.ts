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
