import { TypedChow } from '../../server'
import { validChannel } from './join-channel'
import createDebug = require('debug')

const debug = createDebug('api:socket:start-channel')

const sixHours = 6 * 60 * 60

export default function startChannel(chow: TypedChow) {
  //
  // @start-channel(sessionId, channel)
  //
  chow.socket('start-channel', async (ctx, sessionId, channel) => {
    const { socket, sendError, users, redis, schedule, emitToRoom } = ctx
    debug(`socket="${socket.id}" sessionId="${sessionId}" channel="${channel}"`)

    //
    // Ensure the correct arguments were passed
    //
    if (typeof sessionId !== 'string' || typeof channel !== 'string') {
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
    // Get the session they're broadcasting to
    //
    const session = await schedule.findSession(sessionId)
    if (!session || !session.enableTranslation || !validChannel(channel)) {
      return sendError('Session not found')
    }

    const channelKey = `translator_${session.id}_${channel}`
    const translatorKey = `translator_${socket.id}`

    //
    // Check for an existing translator and boot them
    //
    const existingTranslator = await redis.get(channelKey)
    if (existingTranslator && existingTranslator !== socket.id) {
      debug(`kick translator "${existingTranslator}"`)
      await redis.del(translatorKey)
      emitToRoom(existingTranslator, 'channel-takeover')
    }

    //
    // Store the socket id of the translator for this session-channel
    //
    await redis.setAndExpire(channelKey, socket.id, sixHours)

    //
    // Store a packet to quickly know which session to broadcast to
    //
    const packet = [session.id, channel].join(';')
    await redis.setAndExpire(translatorKey, packet, sixHours)
  })
}
