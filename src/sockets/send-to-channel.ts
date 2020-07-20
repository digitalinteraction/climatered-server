import { TypedChow } from '../server'

export default function sendToChannel(chow: TypedChow) {
  //
  // @send-to-channel(rawData)
  //
  chow.socket('send-to-channel', async (ctx, rawData) => {
    const { sendError, emitToRoom, socket, redis } = ctx

    const packet = await redis.get(`translator_${socket.id}`)

    if (!packet) return sendError('Bad auth')

    const [eventId, channel] = packet.split(';')
    const key = `channel-${eventId}-${channel}`

    emitToRoom(key, rawData)
  })
}
