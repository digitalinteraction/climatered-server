import http = require('http')
import path = require('path')
import express = require('express')

import createDebug = require('debug')
import Redis = require('ioredis')
import socketIo = require('socket.io')
import socketIoRedis = require('socket.io-redis')
import { createTerminus } from '@godaddy/terminus'

import sendgrid = require('@sendgrid/mail')

import { createEnv } from './env'
import { createRoutes } from './routes'
import { pkg } from './pkg'
import { createSockets } from './sockets'

const debug = createDebug('api:server')

async function onSignal(redis: Redis.Redis) {
  console.log('Starting cleanup')

  await redis.quit()
}

async function healthcheck(redis: Redis.Redis) {
  debug('GET /healthz')
  await redis.ping()
}

// So there is enough time for k8s to find out the pod is terminating
async function beforeShutdown(nodeEnv: string) {
  if (nodeEnv === 'development') return
  return new Promise((resolve) => setTimeout(resolve, 5000))
}

export async function runServer() {
  debug(`#runServer pkg=${pkg.name}, version=${pkg.version}`)

  const env = createEnv()
  debug('environment ok')

  //
  // Create express and socket io apps
  //
  const app = express()
  const server = http.createServer(app)
  const io = socketIo(server)
  io.adapter(socketIoRedis(env.REDIS_URL))

  //
  // Connect to redis
  //
  debug(`connecting to redis=${env.REDIS_URL}`)
  const redis = new Redis(env.REDIS_URL)

  //
  // Setup sendgrid
  //
  sendgrid.setApiKey(env.SENDGRID_API_KEY)

  //
  // Setup our routes
  //
  app.use(createRoutes(io, env))

  //
  // Setup our sockets
  //
  createSockets(io, redis, env)

  //
  // Ensure the server shuts down consistently for k8s
  //
  createTerminus(server, {
    healthChecks: {
      '/healthz': () => healthcheck(redis),
    },
    signals: ['SIGINT', 'SIGTERM'],
    onSignal: () => onSignal(redis),
    beforeShutdown: () => beforeShutdown(env.NODE_ENV),
  })

  //
  // Start listening
  //
  await new Promise((resolve) => server.listen(3000, resolve))
  console.log('Listening on :3000')
}
