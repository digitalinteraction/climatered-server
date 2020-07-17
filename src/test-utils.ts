import { mockchow, MockChowish } from '@robb_j/mockchow'
import express = require('express')
import jwt = require('jsonwebtoken')
import { Env } from './env'
import { Context, TypedChow } from './server'

import { RedisService } from './services/redis'
import { JwtService, AuthJwt } from './services/jwt'
import { ScheduleService, Slot, ScheduleEvent } from './services/schedule'
import { UrlService, createUrlService } from './services/url'
import { UsersService, Registration } from './services/users'
import { SockChow, SockContext } from './sockchow'

export { mocked } from 'ts-jest/utils'

export type TypedMockChow = MockChowish & TypedChow & TestExtras

interface TestExtras {
  redis: RedisService
  jwt: JwtService
  schedule: ScheduleService
  url: UrlService
  users: UsersService
  app: express.Application
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
  }
}

function mockRedis(): RedisService {
  return {
    ping: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }
}

function mockJwt(secretKey: string): JwtService {
  const authJwt: AuthJwt = {
    typ: 'auth',
    sub: 'user@example.com',
    user_roles: ['attendee'],
    user_lang: 'en',
  }
  return {
    sign: jest.fn((payload, opts) => jwt.sign(payload, secretKey, opts)),
    verify: jest.fn((token) => jwt.verify(token, secretKey)),
    authFromRequest: jest.fn((request) =>
      request.headers.authorization === 'Bearer valid_auth_token'
        ? authJwt
        : null
    ),
  }
}

export const createSlot = (id: string, start: number) => ({
  id: id,
  start: new Date(`2020-06-15T${start}:00:00.000Z`),
  end: new Date(`2020-06-15T${start + 1}:00:00.000Z`),
})

export const createEvent = (
  id: string,
  type: string,
  slot: string,
  translated: boolean
) => ({
  id,
  name: `Event ${type} ${id}`,
  type: type as any,
  slot,
  title: {
    en: 'Title - en',
    fr: 'Title - fr',
    es: 'Title - es',
    ar: 'Title - ar',
  },
  content: {
    en: 'Content - en',
    fr: 'Content - fr',
    es: 'Content - es',
    ar: 'Content - ar',
  },
  links: [
    { type: 'video', url: 'https://youtu.be/dQw4w9WgXcQ', language: 'en' },
  ],
  hostLanguage: 'en',
  enableTranslation: translated,
})

function mockSchedule(): ScheduleService {
  const slots: Slot[] = [
    createSlot('001', 12),
    createSlot('002', 13),
    createSlot('003', 14),
  ]

  const events: ScheduleEvent[] = [
    createEvent('001', 'plenary', '001', true),
    createEvent('002', 'panel', '002', true),
    createEvent('003-a', 'session', '003', false),
    createEvent('003-b', 'session', '003', false),
    createEvent('003-c', 'session', '003', false),
  ]

  return {
    getSlots: jest.fn(async () => slots),
    getEvents: jest.fn(async () => events),
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
      roles: ['attendee'],
    },
  }
  return {
    getRegistration: jest.fn(async (email) => registrations[email]),
    registrationForSocket: jest.fn(async () => null),
  }
}

export function createServer(): TypedMockChow {
  const env = createTestEnv()

  const redis = mockRedis()
  const jwt = mockJwt(env.JWT_SECRET)
  const schedule = mockSchedule()
  const url = mockUrl(env.SELF_URL, env.WEB_URL)
  const users = mockUsers()

  const chow = new SockChow<Env, Context>(
    (base) => ({ ...base, ...extras }),
    env
  )

  const extras: TestExtras = {
    redis,
    jwt,
    schedule,
    url,
    users,
    app: chow.app,
  }

  return mockchow(chow, extras) as TypedMockChow
}
