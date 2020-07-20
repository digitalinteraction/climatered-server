import { TypedChow } from '../../server'
import { validChannel } from './join-channel'
import createDebug = require('debug')

const debug = createDebug('api:socket:leave-channel')

export default function leaveChannel(chow: TypedChow) {
  //
  // @leave-channel(eventId, channel)
  //
  chow.socket('leave-channel', async (ctx, eventId, channel) => {
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
    // Find the event to unsubscribe from
    //
    const allEvents = await schedule.getEvents()
    const event = allEvents.find((e) => e.id === eventId)
    if (!event || !event.enableTranslation || !validChannel(channel)) {
      return sendError('Event not found')
    }

    //
    // If all assetions passed so far, remove them from the channel
    //
    socket.leave(`channel-${event.id}-${channel}`)
  })
}
