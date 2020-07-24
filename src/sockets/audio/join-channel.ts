import { TypedChow } from '../../server'
import createDebug = require('debug')

const debug = createDebug('api:socket:join-channel')

export function validChannel(channel: string) {
  return ['en', 'fr', 'es', 'ar'].includes(channel)
}

export default function joinChannel(chow: TypedChow) {
  //
  // @join-channel(sessionId, channel)
  //
  chow.socket('join-channel', async (ctx, sessionId, channel) => {
    const { socket, redis, users, schedule, sendError } = ctx

    debug(`socket="${socket.id}" sessionId="${sessionId}" channel="${channel}"`)

    //
    // Ensure the correct arguments were passed up
    //
    if (typeof sessionId !== 'string' || typeof channel !== 'string') {
      return sendError('Invalid socket arguments')
    }

    //
    // Check the socket's authentication
    //
    const registration = await users.registrationForSocket(socket.id, redis)
    if (!registration) return sendError('Bad auth')

    //
    // Find the session they want to subscribe to
    //
    const session = await schedule.findSession(sessionId)
    if (!session || !session.enableTranslation || !validChannel(channel)) {
      return sendError('Session not found')
    }

    //
    // If they passed all checks, subscribe them for audio
    //
    socket.join(`channel-${session.id}-${channel}`)
  })
}
