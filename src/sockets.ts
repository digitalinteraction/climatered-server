import { Redis } from 'ioredis'
import { Server as SocketServer, Socket } from 'socket.io'
import createDebug = require('debug')
import { Env } from './env'
import { checkAuthorization, getJwt } from './routes'

import slots = require('./data/slots.json')
import events = require('./data/events.json')
import registrations = require('./data/registrations.json')

const debug = createDebug('api:sockets')

// Send an error back to the socket client
function sendError(socket: Socket, message: string) {
  debug(`sendError id="${socket.id}" message="${message}"`)
  socket.emit('user-error', { message })
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
  io.origins(env.CORS_HOSTS)

  //
  // Handle each new socket connection
  //
  io.on('connection', (socket) => {
    debug(`connected id=${socket.id}`)

    //
    // A socket endpoint to authenticate itself by passing up a jwt
    //
    socket.on('auth', async ({ token = '' }) => {
      const hasAuth = checkAuthorization(env.JWT_SECRET, {
        authorization: `Bearer ${token}`,
      })
      debug(`auth id=${socket.id} token=${token} hasAuth=${hasAuth}`)

      if (hasAuth) {
        await redis.set('auth_' + socket.id, token)
      } else {
        sendError(socket, 'Not authorized')
      }
    })

    //
    // A socket endpoint to join an event
    //
    socket.on('join-event', async ({ eventId = '' }) => {
      debug(`join-event id=${eventId}`)

      const user = await getUser(socket.id, redis)
      if (!user) return sendError(socket, 'bad_auth')

      const event = events.find((e) => e.id === eventId)
      if (!event) return sendError(socket, `event.not_found`)
      socket.join(event.id)

      io.in(event.id).emit('user-joined', { name: user.name })
    })

    //
    // A socket endpoint to leave an event
    //
    socket.on('leave-event', async ({ eventId = '' }) => {
      debug(`leave-event id=${eventId}`)

      const user = await getUser(socket.id, redis)
      if (!user) return sendError(socket, 'bad_auth')

      const event = events.find((e) => e.id === eventId)
      if (!event) return sendError(socket, `event.not_found`)
      socket.leave(event.id)

      io.in(event.id).emit('user-left', { name: user.name })
    })

    //
    // A socket endpoint to send a chat message to an event
    //
    socket.on('chat', async ({ eventId = '', message = '' }) => {
      debug(`chat event=${eventId} message=${message}`)

      const user = await getUser(socket.id, redis)
      if (!user) return sendError(socket, 'bad_auth')

      const event = events.find((e) => e.id === eventId)
      if (!event) return sendError(socket, `event.not_found`)

      io.in(event.id).emit('chat', { name: user.name, message })
    })

    //
    // Listen for disconnects too
    //
    socket.on('disconnect', (e) => {
      debug(`disconnected id=${socket.id}`)
    })
  })
}
