import { TypedChow } from '../../server'
import { validChannel } from './join-channel'
import createDebug = require('debug')

const debug = createDebug('api:socket:leave-channel')

export default function leaveChannel(chow: TypedChow) {
  //
  // @leave-channel(sessionId, channel)
  //
  chow.socket('leave-channel', async (ctx, sessionId, channel) => {
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
    // Find the session to unsubscribe from
    //
    const session = await schedule.findSession(sessionId)
    if (!session || !session.enableTranslation || !validChannel(channel)) {
      return sendError('Session not found')
    }

    //
    // If all assetions passed so far, remove them from the channel
    //
    socket.leave(`channel-${session.id}-${channel}`)
  })
}
