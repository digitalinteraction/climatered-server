import createDebug = require('debug')

const debug = createDebug('api:cmd:fake-schedule')

import { createSession } from '../test-utils/fixtures'
import { runScraper } from './scrape-content'
import { createRedisService } from '../services/redis'
import validateEnv from 'valid-env'
import { Slot, Session, Speaker } from '../structs'

interface FakeScheduleArgs {}

function randomFrom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomSession(
  id: string,
  type: string,
  slotIds: string[],
  trackIds: string[],
  speakers: string[],
  translated: boolean
): Session {
  const session: Session = {
    slug: id,
    id,
    type,
    slot: randomFrom(slotIds),
    track: randomFrom(trackIds),
    themes: [],
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
    hostLanguage: randomFrom(['en', 'fr', 'es', 'ar']),
    enableTranslation: translated,
    speakers: [],
    hostOrganisation: randomFrom(['Org A', 'Org B', 'Org C', 'Org D']),
    isRecorded: randomFrom([true, false]),
    attendeeInteraction: randomFrom(['interactive', 'view']),
    attendeeDevices: randomFrom(['desktop', 'mobile', 'all']),
  }

  if (type === 'plenary' || type === 'panel') {
    const numSpeakers = randomFrom([1, 2, 3])
    for (let i = 0; i < numSpeakers; i++) {
      session.speakers.push(randomFrom(speakers))
    }
  }

  return session
}

function createSpeaker(name: string, role: string): Speaker {
  return {
    slug: name.replace(/\s+/g, '-').toLowerCase(),
    name,
    role,
    headshot: '/uploads/speaker-default.svg',
  }
}

export async function fakeSchedule(args: FakeScheduleArgs = {}) {
  debug('#fakeSchedule args=%O', args)

  validateEnv(['REDIS_URL'])
  const { REDIS_URL } = process.env as Record<string, string>

  const redis = createRedisService(REDIS_URL)

  // Run the normal scraper to seed slots, tracks & themes
  await runScraper()

  const slots = await redis.getJson<Slot[]>('schedule.slots', [])
  const slotIds = slots.map((s) => s.id)

  const tracks = await redis.getJson<Slot[]>('schedule.tracks', [])
  const trackIds = tracks.map((s) => s.id)

  const speakers = [
    createSpeaker('Geoff Testington', 'CEO Banana Corp'),
    createSpeaker('Heather Wisely', 'CTO Orange Digital'),
    createSpeaker('Sulayman Mathis', 'CFO Lemon Bros'),
    createSpeaker('Elen Foster', 'Partner at Pineapple Ltd'),
  ]
  const speakerIds = speakers.map((s) => s.slug)
  const official = ['official']

  const sessions = [
    randomSession('plenary', 'plenary', slotIds, official, speakerIds, true),
    randomSession('panel-01', 'panel', slotIds, official, speakerIds, true),
    randomSession('panel-02', 'panel', slotIds, trackIds, speakerIds, true),
    randomSession('talk', 'ignite-talk', slotIds, trackIds, speakerIds, true),
    randomSession('games', 'games', slotIds, trackIds, speakerIds, true),
    randomSession('tour', 'virtual-tour', slotIds, trackIds, speakerIds, true),
    randomSession('speaker', 'speaker', slotIds, trackIds, speakerIds, true),
    randomSession('fishbowl', 'fishbowl', slotIds, trackIds, speakerIds, true),
  ]

  await redis.set('schedule.sessions', JSON.stringify(sessions))
  await redis.set('schedule.speakers', JSON.stringify(speakers))

  await redis.quit()
}
