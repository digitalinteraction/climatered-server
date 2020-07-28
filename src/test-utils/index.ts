import { mockchow, MockChowish } from '@robb_j/mockchow'
import express = require('express')
import base64id = require('base64id')
import { Env } from '../env'
import { Context, TypedChow } from '../server'

import { RedisService } from '../services/redis'
import { JwtService, createJwtService } from '../services/jwt'
import { ScheduleService } from '../services/schedule'
import { UrlService, createUrlService } from '../services/url'
import { UsersService, Registration, compareEmails } from '../services/users'
import { AuthService, createAuthService } from '../services/auth'

import { SockChow, SockContext, ChowSocket, EmitToRoomFn } from '../sockchow'
import { createSlot, createSession } from './fixtures'

export { mocked } from 'ts-jest/utils'
export { Registration } from '../services/users'
export { AuthJwt, LoginJwt } from '../services/jwt'

export * from './fixtures'

export type TypedMockChow = MockChowish & TypedChow & TestExtras

interface TestExtras {
  redis: RedisService
  jwt: JwtService
  schedule: ScheduleService
  url: UrlService
  users: UsersService
  auth: AuthService
  app: express.Application
  io(): MockSocket
}

export function createTestEnv(): Env {
  return {
    NODE_ENV: 'development',
    CORS_HOSTS: [],
    SENDGRID_API_KEY: 'localhost_fake_key',
    SENDGRID_FROM: 'admin@example.com',
    JWT_SECRET: 'not_top_secret',
    SELF_URL: 'http://api.localhost',
    WEB_URL: 'http://web.localhost',
    REDIS_URL: 'redis://localhost',
    ENABLE_ACCESS_LOGS: false,
  }
}

function mockRedis(): RedisService {
  const data = new Map<string, string>()

  return {
    ping: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(async (k) => data.get(k) ?? null),
    getJson: jest.fn(async (k, f) =>
      data.has(k) ? JSON.parse(data.get(k)!) : f
    ),
    set: jest.fn(async (k, v) => data.set(k, v) as any),
    setAndExpire: jest.fn(async (k, v) => data.set(k, v) as any),
    del: jest.fn(async (k) => (data.delete(k), 1)),
  }
}

function mockJwt(secretKey: string): JwtService {
  const jwt = createJwtService(secretKey)
  return {
    sign: jest.fn((payload, opts) => jwt.sign(payload, opts)),
    verify: jest.fn((token) => jwt.verify(token)),
  }
}

function mockSchedule(): ScheduleService {
  const slots = [
    createSlot('001', 12),
    createSlot('002', 13),
    createSlot('003', 14),
  ]

  const sessions = [
    createSession('001', 'plenary', '001', true),
    createSession('002', 'panel', '002', true),
    createSession('003-a', 'session', '003', false),
    createSession('003-b', 'session', '003', false),
    createSession('003-c', 'session', '003', false),
  ]

  return {
    getSlots: jest.fn(async () => slots),
    getSessions: jest.fn(async () => sessions),
    findSession: jest.fn(
      async (id) => sessions.find((e) => e.id === id) ?? null
    ),
    getTracks: jest.fn(),
    getThemes: jest.fn(),
    getSpeakers: jest.fn(),
  }
}

function mockUrl(self: string, web: string): UrlService {
  const url = createUrlService(self, web)

  return {
    forSelf: jest.fn((path) => url.forSelf(path)),
    forWeb: jest.fn((path) => url.forWeb(path)),
  }
}

function mockUsers(): UsersService {
  const registrations: Record<string, Registration> = {
    'user@example.com': {
      name: 'Geoff Testington',
      email: 'user@example.com',
      language: 'en',
    },
  }
  return {
    getRegistration: jest.fn(async (email) => registrations[email]),
    compareEmails,
  }
}

function mockAuth(redis: RedisService, jwt: JwtService): AuthService {
  const auth = createAuthService(redis, jwt)

  return {
    fromRequest: jest.fn((request) => auth.fromRequest(request)),
    fromSocket: jest.fn((id) => auth.fromSocket(id)),
  }
}

/**
 * A ChowSocket for testing
 * - Allows you to await socket.emit
 * - Adds sendError as a jest.fn for testing errors
 */
type MockSocket = {
  emit(message: string, ...args: any[]): Promise<void>
  sendError(message: string): void
} & ChowSocket

/**
 * Creates a fake socket.io client to test sending sockets
 * and their interactions
 */
function fakeIo<E, C extends SockContext<E>>(
  chow: SockChow<E, C>,
  emitToRoom: EmitToRoomFn
) {
  return () => {
    // Generate a unique id for this socket
    // - the same method socket.io engine uses (I belive)
    const id = base64id.generateId()

    // Mock out generic socket functions so they can be tested
    const join = jest.fn()
    const leave = jest.fn()
    const sendError = jest.fn((message) => {
      throw new Error(`#sendError called with: ` + message)
    })

    // A custom emit method to directly call handlers
    const emit = jest.fn(async (message, ...args) => {
      const handler = chow.socketHandlers.get(message)

      if (!handler) {
        console.error(
          `Unknown socket message '${message}' registered:`,
          chow.socketHandlers.keys()
        )
        throw new Error(`Unknown socket message '${message}'`)
      }

      const ctx = await chow.makeContext()
      await handler({ ...ctx, socket, sendError, emitToRoom }, ...args)
    })

    // Create and return our socket
    const socket: MockSocket = { id, join, leave, emit, sendError }
    return socket
  }
}

export function createServer(): TypedMockChow {
  const env = createTestEnv()

  const redis = mockRedis()
  const jwt = mockJwt(env.JWT_SECRET)
  const schedule = mockSchedule()
  const url = mockUrl(env.SELF_URL, env.WEB_URL)
  const users = mockUsers()
  const auth = mockAuth(redis, jwt)

  const chow = new SockChow<Env, Context>(
    (base) => ({ ...base, ...extras }),
    env
  )

  const socket = jest.fn((message: string, handler) => {
    chow.socket(message, handler)
  })

  const emitToRoom = jest.fn((room, message, ...args) => {
    chow.emitToRoom(room, message, ...args)
  })

  const io = fakeIo(chow, emitToRoom)

  const extras: TestExtras = {
    redis,
    jwt,
    schedule,
    url,
    users,
    app: chow.app,
    io,
    auth,
  }

  return Object.assign(mockchow(chow, extras), { socket, emitToRoom })
}
