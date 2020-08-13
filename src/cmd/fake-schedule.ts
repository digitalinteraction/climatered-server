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
  const locale = randomFrom(['en', 'fr', 'es', 'ar'])
  const org = randomFrom(['Org A', 'Org B', 'Org C', 'Org D'])

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
    links: [],
    hostLanguage: [locale],
    enableTranslation: translated,
    speakers: [],
    hostOrganisation: {
      en: org,
      fr: org,
      es: org,
      ar: org,
    },
    isRecorded: randomFrom([true, false]),
    attendeeInteraction: randomFrom(['interactive', 'view']),
    attendeeDevices: randomFrom(['desktop', 'mobile', 'all']),
    isOfficial: false,
    isDraft: false,
  }

  if (type === 'plenary' || type === 'panel') {
    const numSpeakers = randomFrom([1, 2, 3])
    for (let i = 0; i < numSpeakers; i++) {
      session.speakers.push(randomFrom(speakers))
    }

    session.links.push({
      type: 'video',
      language: 'en',
      url: 'https://youtu.be/4LclSzrB4CY',
    })

    session.links.push({
      type: 'poll',
      language: 'en',
      url: 'https://app.sli.do/event/mfiv2k5j',
    })
    session.links.push({
      type: 'poll',
      language: 'fr',
      url: 'https://app.sli.do/event/qsmtvg5a',
    })
    session.links.push({
      type: 'poll',
      language: 'es',
      url: 'https://app.sli.do/event/j9oit3bk',
    })
    session.links.push({
      type: 'poll',
      language: 'en',
      url: 'https://app.sli.do/event/vr8d1fgw',
    })
  } else {
    session.links.push({
      type: 'video',
      language: '*',
      url: randomFrom([
        'https://youtu.be/4LclSzrB4CY',
        'https://zoom.us/my/robjanderson',
        'https://teams.microsoft.com/l/meetup-join/19%3ameeting_MzliMDhmNDUtZjAwNS00NjQ5LWJkYzMtNTE2NTNhOTY0ZTAw%40thread.v2/0?context=%7b%22Tid%22%3a%229c5012c9-b616-44c2-a917-66814fbe3e87%22%2c%22Oid%22%3a%22ce849a55-9a39-48ec-a3a5-c2371bbc5c68%22%7d',
      ]),
    })
  }

  return session
}

function createSpeaker(name: string, role: string): Speaker {
  return {
    slug: name.replace(/\s+/g, '-').toLowerCase(),
    name,
    role: {
      en: `${role} - en`,
      fr: `${role} - fr`,
      es: `${role} - es`,
      ar: `${role} - en`,
    },
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
