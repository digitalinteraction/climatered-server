import { TypedChow } from '../../server'

export default function stopChannel(chow: TypedChow) {
  //
  // @stop-channel()
  //
  chow.socket('stop-channel', async (ctx) => {
    const { socket, sendError, redis, users, schedule } = ctx

    const user = await users.registrationForSocket(socket.id, redis)
    if (!user || !user.roles.includes('translator')) {
      return sendError('Bad auth')
    }

    const translatorKey = `translator_${socket.id}`

    const packet = await redis.get(translatorKey)
    if (!packet) return sendError('Not broadcasting')

    const [eventId, channel] = packet.split(';')
    const channelKey = `translator_${eventId}_${channel}`
    await redis.del(channelKey)

    await redis.del(translatorKey)
  })
}
