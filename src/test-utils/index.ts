import { mockchow, MockChowish } from '@robb_j/mockchow'
import express = require('express')
import base64id = require('base64id')
import { Env, createTestEnv } from '../env'
import { Context, TypedChow } from '../server'

import { RedisService } from '../services/redis'
import { JwtService } from '../services/jwt'
import { ScheduleService } from '../services/schedule'
import { UrlService } from '../services/url'
import { UsersService } from '../services/users'
import { AuthService } from '../services/auth'
import { PostgresService } from '../services/postgres'

import { SockChow, SockContext, ChowSocket, EmitToRoomFn } from '../sockchow'
import { I18nService } from '../services/i18n'
import {
  mockRedis,
  mockJwt,
  mockSchedule,
  mockUrl,
  mockUsers,
  mockAuth,
  mockPostgres,
  mockI18n,
} from './mock-services'

export { mocked } from 'ts-jest/utils'
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
  pg: PostgresService
  i18n: I18nService
  sql: jest.Mock
  io(): MockSocket
  spyEvent(eventName: string): jest.Mock
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
  ctxOverrides: Partial<C>
) {
  return () => {
    // Generate a unique id for this socket
    // - the same method socket.io engine uses (I belive)
    const id = base64id.generateId()

    // Mock out generic socket functions so they can be tested
    const join = jest.fn()
    const leave = jest.fn()
    const emitBack = jest.fn()
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
      return await handler(
        { ...ctx, socket, sendError, ...ctxOverrides },
        ...args
      )
    })

    const on = jest.fn()
    const once = jest.fn()

    // Create and return our socket
    const socket: MockSocket = {
      id,
      join,
      leave,
      emit,
      emitBack,
      sendError,
      on,
      once,
    }
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
  const [sql, pg] = mockPostgres()
  const i18n = mockI18n()

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

  const getRoomClients = jest.fn(async () => [])
  const emitToEveryone = jest.fn(async () => {})
  const getSocketCount = jest.fn(async () => 0)

  const io = fakeIo(chow, { emitToRoom, getRoomClients })

  const logSpy = () => {
    const spy = jest.fn()
    chow.event('log', (ctx) => spy(ctx.event.payload))
    return spy
  }

  const spyEvent = (eventName: string) => {
    const spy = jest.fn()
    chow.event(eventName, (ctx) => spy(ctx.event.payload))
    return spy
  }

  const extras: TestExtras = {
    redis,
    jwt,
    schedule,
    url,
    users,
    app: chow.app,
    io,
    auth,
    pg,
    sql,
    i18n,
    spyEvent,
  }

  return Object.assign(mockchow(chow, extras), {
    socket,
    emitToRoom,
    getRoomClients,
    emitToEveryone,
    getSocketCount,
  })
}
