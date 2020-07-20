import { TypedChow } from '../../server'
import { validChannel } from './join-channel'

export default function startChannel(chow: TypedChow) {
  //
  // @start-channel(eventId, channel)
  //
  chow.socket('start-channel', async (ctx, eventId, channel) => {
    const { socket, sendError, users, redis, schedule, emitToRoom } = ctx

    //
    // Ensure the correct arguments were passed
    //
    if (typeof eventId !== 'string' || typeof channel !== 'string') {
      return sendError('Bad arguments')
    }

    //
    // Check the bradcaster is a translator
    //
    const user = await users.registrationForSocket(socket.id, redis)
    if (!user || !user.roles.includes('translator')) {
      return sendError('Bad auth')
    }

    //
    // Get the event they're broadcasting to
    //
    const event = await schedule.findEvent(eventId)
    if (!event || !event.enableTranslation || !validChannel(channel)) {
      return sendError('Event not found')
    }

    const channelKey = `translator_${event.id}_${channel}`
    const translatorKey = `translator_${socket.id}`

    //
    // Check for an existing translator and boot them
    //
    const existingTranslator = await redis.get(channelKey)
    if (existingTranslator && existingTranslator !== socket.id) {
      await redis.del(translatorKey)
      emitToRoom(existingTranslator, 'channel-takenover')
    }

    //
    // Store the socket id of the translator for this event-channel
    //
    await redis.set(channelKey, socket.id)

    //
    // Store a packet to quickly know which event to broadcast to
    //
    await redis.set(translatorKey, [event.id, channel].join(';'))
  })
}
