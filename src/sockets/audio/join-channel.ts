import { TypedChow } from '../../server'
import createDebug = require('debug')

const debug = createDebug('api:socket:join-channel')

export function validChannel(channel: string) {
  return ['en', 'fr', 'es', 'ar'].includes(channel)
}

export default function joinChannel(chow: TypedChow) {
  //
  // @join-channel(eventId, channel)
  //
  chow.socket('join-channel', async (ctx, eventId, channel) => {
    const { socket, redis, users, schedule, sendError } = ctx

    debug(`socket="${socket.id}" eventId="${eventId}" channel="${channel}"`)

    //
    // Ensure the correct arguments were passed up
    //
    if (typeof eventId !== 'string' || typeof channel !== 'string') {
      return sendError('Invalid socket arguments')
    }

    //
    // Check the socket's authentication
    //
    const registration = await users.registrationForSocket(socket.id, redis)
    if (!registration) return sendError('Bad auth')

    //
    // Find the event they want to subscribe to
    //
    const event = await schedule.findEvent(eventId)
    if (!event || !event.enableTranslation || !validChannel(channel)) {
      return sendError('Event not found')
    }

    //
    // If they passed all checks, subscribe them for audio
    //
    socket.join(`channel-${event.id}-${channel}`)
  })
}
