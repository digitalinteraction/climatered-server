import { Redis } from 'ioredis'
import { Server as SocketServer, Socket } from 'socket.io'
import createDebug = require('debug')
import { Env } from './env'
import jwt = require('jsonwebtoken')

import slots = require('./data/slots.json')
import events = require('./data/events.json')
import registrations = require('./data/registrations.json')
import { AuthJwt } from './services/jwt'

const debug = createDebug('api:sockets')

function getJwt(authorization: string) {
  return jwt.decode(authorization) as AuthJwt
}

// Send an error back to the socket client
function sendError(socket: Socket, from: string, message: string) {
  debug(`sendError id="${socket.id}" message="${message}"`)
  socket.emit('user-error', { from, message })
}

// Get a user registration from a socket.id and redis instance
// socket.id -> redis -> jwt -> email
async function getUser(socketId: string, redis: Redis) {
  const token = await redis.get('auth_' + socketId)
  if (!token) return null
  const jwt = getJwt(token)
  return registrations.find((r) => r.email === jwt.sub) ?? null
}

export function createSockets(io: SocketServer, redis: Redis, env: Env) {
  // io.origins(env.CORS_HOSTS)

  //
  // Handle each new socket connection
  //
  io.on('connection', (socket) => {
    debug(`connected id=${socket.id}`)

    //
    // A socket endpoint to authenticate itself by passing up a jwt
    //
    // socket.on('auth', async ({ token = '' }) => {
    //   const hasAuth = checkAuthorization(env.JWT_SECRET, {
    //     authorization: `Bearer ${token}`,
    //   })
    //   debug(`auth id=${socket.id} token=${token} hasAuth=${hasAuth}`)

    //   if (hasAuth) {
    //     await redis.set('auth_' + socket.id, token)
    //   } else {
    //     sendError(socket, 'auth', 'Not authorized')
    //   }
    // })

    //
    // A socket endpoint to join an event
    //
    socket.on('join-event', async ({ eventId = '' }) => {
      debug(`join-event id=${eventId}`)

      const user = await getUser(socket.id, redis)
      if (!user) return sendError(socket, 'join-event', 'bad_auth')

      const event = events.find((e) => e.id === eventId)
      if (!event) return sendError(socket, 'join-event', `event.not_found`)
      socket.join(event.id)

      io.in(event.id).emit('user-joined', { name: user.name })
    })

    //
    // A socket endpoint to leave an event
    //
    socket.on('leave-event', async ({ eventId = '' }) => {
      debug(`leave-event id=${eventId}`)

      const user = await getUser(socket.id, redis)
      if (!user) return sendError(socket, 'leave-event', 'bad_auth')

      const event = events.find((e) => e.id === eventId)
      if (!event) return sendError(socket, 'leave-event', `event.not_found`)
      socket.leave(event.id)

      io.in(event.id).emit('user-left', { name: user.name })
    })

    //
    // A socket endpoint to send a chat message to an event
    //
    socket.on('chat', async ({ eventId = '', message = '' }) => {
      debug(`chat event=${eventId} message=${message}`)

      const user = await getUser(socket.id, redis)
      if (!user) return sendError(socket, 'chat', 'bad_auth')

      const event = events.find((e) => e.id === eventId)
      if (!event) return sendError(socket, 'chat', `event.not_found`)

      io.in(event.id).emit('chat', { name: user.name, message })
    })

    //
    // [A prototype refactoring for the below methods]
    //
    // async function validateChannel(
    //   socket: Socket,
    //   eventId: string,
    //   channel: string
    // ) {
    //   const user = await getUser(socket.id, redis)
    //   if (!user) throw new Error('bad_auth')

    //   const event = events.find((e) => e.id === eventId)
    //   if (!event) throw new Error('event_not_found')

    //   const found = event.channels?.includes(channel)
    //   if (!found) throw new Error('channel_not_found')

    //   return { user, event }
    // }

    //
    // Listen to a channel on an event
    //
    // socket.on('join-channel', async ({ eventId = '', channel = '' }) => {
    //   debug(`join-channel event=${eventId} channel=${channel}`)

    //   const user = await getUser(socket.id, redis)
    //   if (!user) return sendError(socket, 'join-channel', 'bad_auth')

    //   const event = events.find((e) => e.id === eventId)
    //   if (!event) return sendError(socket, 'join-channel', `event.not_found`)

    //   const found = event.channels?.includes(channel)
    //   if (!found) return sendError(socket, 'join-channel', `channel.not_found`)

    //   socket.join(`channel-${event.id}-${channel}`)
    // })

    //
    // Stop listening to a channel
    //
    // socket.on('leave-channel', async ({ eventId = '', channel = '' }) => {
    //   debug(`leave-channel event=${eventId} channel=${channel}`)

    //   const user = await getUser(socket.id, redis)
    //   if (!user) return sendError(socket, 'leave-channel', 'bad_auth')

    //   const event = events.find((e) => e.id === eventId)
    //   if (!event) return sendError(socket, 'leave-channel', `event.not_found`)

    //   const found = event.channels?.includes(channel)
    //   if (!found) return sendError(socket, 'leave-channel', `channel.not_found`)

    //   socket.leave(`channel-${event.id}-${channel}`)
    // })

    //
    // Start translating for a channel
    //
    // socket.on('start-channel', async ({ eventId = '', channel = '' }) => {
    //   debug(`start-channel event=${eventId} channel=${channel}`)

    //   // Make sure the user exists and they are a translator
    //   const user = await getUser(socket.id, redis)
    //   if (!user || !user.roles.includes('translator')) {
    //     return sendError(socket, 'start-channel', 'bad_auth')
    //   }

    //   // Ensure the event exists
    //   const event = events.find((e) => e.id === eventId)
    //   if (!event) return sendError(socket, 'start-channel', `event.not_found`)

    //   // Ensure the channel exists
    //   const found = event.channels?.includes(channel)
    //   if (!found) return sendError(socket, 'start-channel', `channel.not_found`)

    //   // Generate the lock key
    //   // This value points to the current translator for this channel
    //   // (assuming 2 people broadcasting would be an issue)?
    //   const key = `translator_${eventId}_${channel}`

    //   // If there is already a translator for that room, remove them
    //   const existing = await redis.get(key)
    //   if (existing && existing !== socket.id) {
    //     await redis.del(`translator_${existing}`)
    //     io.in(existing).emit('stop-channel-data')
    //   }

    //   // Make this new use the translator
    //   // And store the socket-packet so they can send data
    //   await redis.set(key, socket.id)
    //   await redis.set(`translator_${socket.id}`, [eventId, channel].join(';'))
    // })

    //
    // Listen for translator packets and broadcast them
    //
    // socket.on('channel-data', async (blob) => {
    //   debug(`channel-data id=${socket.id}`)

    //   const packet = await redis.get(`translator_${socket.id}`)
    //   if (!packet) return sendError(socket, 'channel-data', 'bad_auth')

    //   const [eventId, channel] = packet.split(';')

    //   const key = `channel-${eventId}-${channel}`
    //   debug('  sendTo=%s', key)

    //   io.in(key).emit('channel-data', blob)
    // })

    //
    // Listen for disconnects too
    //
    socket.on('disconnect', (e) => {
      debug(`disconnected id=${socket.id}`)
    })
  })
}
