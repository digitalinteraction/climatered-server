import {
  ConferenceConfig,
  Interpreter,
  Session,
  SessionSlot,
  SessionState,
  SessionType,
  SessionVisibility,
  Speaker,
  Theme,
  Track,
} from '@openlab/deconf-shared'

import { createDebug, createEnv, RedisService } from '../lib/module.js'

const debug = createDebug('cr:cmd:fake-schedule')

export interface FakeScheduleCommandOptions {
  interpreter: string[]
}

export async function fakeScheduleCommand(options: FakeScheduleCommandOptions) {
  debug('start')

  const env = createEnv()
  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL not set')
  }

  debug('redis %o', env.REDIS_URL)
  const redis = new RedisService(env.REDIS_URL)

  debug('interpreters %o', options.interpreter)
  const interpreters = options.interpreter.map((email, i) =>
    mockInterpreter({ id: `interpreter-${i + 1}`, email })
  )

  debug('Generating schedule')
  const schedule = getFakeSchedule()

  debug('saving to redis')
  await Promise.all([
    redis.put('schedule.slots', schedule.slots),
    redis.put('schedule.sessions', schedule.sessions),
    redis.put('schedule.tracks', schedule.tracks),
    redis.put('schedule.themes', schedule.themes),
    redis.put('schedule.speakers', schedule.speakers),
    redis.put('schedule.types', schedule.types),
    redis.put('schedule.settings', schedule.settings),
    redis.put('schedule.interpreters', interpreters),
  ])

  await redis.close()
}

function pickOne<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)]
}

function pickMany<T>(array: T[], count: number) {
  return Array.from({ length: count }, () => pickOne(array))
}

function getFakeSchedule() {
  const start = new Date()
  start.setHours(24, 0, 0, 0)

  const mockDate = (offset: number) => {
    const date = new Date(start)
    date.setMinutes(date.getMinutes() + offset)
    return date
  }

  const slots: SessionSlot[] = [
    mockSlot({ id: 'slot-a', start: mockDate(0), end: mockDate(60) }),
    mockSlot({ id: 'slot-b', start: mockDate(60), end: mockDate(150) }),
    mockSlot({ id: 'slot-c', start: mockDate(150), end: mockDate(180) }),
  ]

  const types: SessionType[] = [
    mockSessionType({ id: 'plenary', title: mockLocalised('Plenary') }),
    mockSessionType({ id: 'workshop', title: mockLocalised('Workshop') }),
  ]

  const themes: Theme[] = [
    mockTheme({ id: 'theme-a', title: mockLocalised('Theme A') }),
    mockTheme({ id: 'theme-b', title: mockLocalised('Theme B') }),
    mockTheme({ id: 'theme-c', title: mockLocalised('Theme C') }),
    mockTheme({ id: 'theme-d', title: mockLocalised('Theme D') }),
  ]

  const tracks: Track[] = [
    mockTrack({ id: 'track-a', title: mockLocalised('Track A') }),
    mockTrack({ id: 'track-b', title: mockLocalised('Track B') }),
    mockTrack({ id: 'track-c', title: mockLocalised('Track C') }),
  ]

  const speakers: Speaker[] = [
    mockSpeaker({
      id: 'speaker-a',
      name: 'Speaker A',
      role: mockLocalised('Role A'),
    }),
    mockSpeaker({
      id: 'speaker-b',
      name: 'Speaker B',
      role: mockLocalised('Role B'),
    }),
    mockSpeaker({
      id: 'speaker-a',
      name: 'Speaker C',
      role: mockLocalised('Role C'),
    }),
  ]

  const sessionBase = () => ({
    track: pickOne(tracks).id,
    themes: pickMany(themes, 2).map((t) => t.id),
    speakers: pickMany(speakers, 3).map((s) => s.id),
  })

  const sessions: Session[] = [
    mockSession({
      id: 'session-a',
      type: 'plenary',
      slot: 'slot-a',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-b',
      type: 'plenary',
      slot: 'slot-b',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-c',
      type: 'workshop',
      slot: 'slot-b',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-d',
      type: 'workshop',
      slot: 'slot-b',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-e',
      type: 'workshop',
      slot: 'slot-b',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-f',
      type: 'plenary',
      slot: 'slot-c',
      ...sessionBase(),
    }),
  ]

  const settings = mockSettings()

  return { slots, types, themes, tracks, speakers, sessions, settings }
}

//
// Generators
//
function makeFixture<T>(base: T) {
  return (options: Partial<T> = {}): T => ({ ...base, ...options })
}

export const mockLocalised = (text: string) => ({
  en: text,
  fr: text,
  es: text,
  ar: text,
})

export const mockSession = makeFixture<Session>({
  id: 'session-a',
  type: 'plenary',
  slot: undefined,
  track: 'track-a',
  themes: ['theme-a', 'theme-b'],
  coverImage: undefined,
  title: mockLocalised('Session Title'),
  content: mockLocalised('Session Info'),
  links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
  hostLanguages: ['en'],
  enableInterpretation: false,
  speakers: ['speaker-a', 'speaker-b', 'speaker-c'],
  hostOrganisation: mockLocalised('Host Organisation'),
  isRecorded: false,
  isOfficial: false,
  isFeatured: false,
  visibility: SessionVisibility.public,
  state: SessionState.confirmed,
  participantCap: null,
  proxyUrl: undefined,
  hideFromSchedule: false,
})

export const mockSlot = makeFixture<SessionSlot>({
  id: 'slot-a',
  start: new Date('2000-01-01T00:00:00.000Z'),
  end: new Date('3000-01-01T00:00:00.000Z'),
})

export const mockTrack = makeFixture<Track>({
  id: 'track-a',
  title: mockLocalised('Track Title'),
})

export const mockTheme = makeFixture<Theme>({
  id: 'theme-a',
  title: mockLocalised('Theme Title'),
})

export const mockSpeaker = makeFixture<Speaker>({
  id: 'speaker-a',
  name: 'Speaker name',
  role: mockLocalised('Speaker Role'),
  bio: mockLocalised('Speaker Bio'),
  headshot: undefined,
})

export const mockSessionType = makeFixture<SessionType>({
  id: 'type-a',
  iconGroup: 'far',
  iconName: 'circle',
  layout: 'plenary',
  title: mockLocalised('Type Title'),
})

export const mockSettings = makeFixture<ConferenceConfig>({
  atrium: { enabled: true, visible: true },
  whatsOn: { enabled: true, visible: true },
  schedule: { enabled: true, visible: true },
  coffeeChat: { enabled: true, visible: true },
  helpDesk: { enabled: true, visible: true },
  startDate: new Date('2000-01-01T00:00:00.000Z'),
  endDate: new Date('3000-01-01T00:00:00.000Z'),
  isStatic: false,
})

export const mockInterpreter = makeFixture<Interpreter>({
  id: 'interpreter-a',
  name: 'Jess Smith',
  email: 'jess@example.com',
})
