import { TypedChow } from '../server'

export function validChannel(channel: string) {
  return ['en', 'fr', 'es', 'ar'].includes(channel)
}

export default function joinChannel(chow: TypedChow) {
  //
  // join-channel(eventId, channel)
  //
  chow.socket('join-channel', async (ctx, eventId, channel) => {
    const { socket, redis, users, schedule, sendError } = ctx

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
    const allEvents = await schedule.getEvents()
    const event = allEvents.find((e) => e.id === eventId)
    if (!event || !event.enableTranslation || !validChannel(channel)) {
      return sendError('Event not found')
    }

    //
    // If they passed all checks, subscribe them for audio
    //
    socket.join(`channel-${event.id}-${channel}`)
  })
}
