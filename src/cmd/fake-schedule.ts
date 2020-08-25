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

function badShuffle<T>(arr: T[]) {
  return Array.from(arr).sort(() => randomFrom([-1, 1]))
}

const loremIpsum = `Donec sed odio dui. Curabitur blandit tempus porttitor. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.

Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Maecenas faucibus mollis interdum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec id elit non mi porta gravida at eget metus.

Cras justo odio, dapibus ac facilisis in, egestas eget quam. Curabitur blandit tempus porttitor. Nullam id dolor id nibh ultricies vehicula ut id elit. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Sed posuere consectetur est at lobortis. Vestibulum id ligula porta felis euismod semper.

Cras mattis consectetur purus sit amet fermentum. Etiam porta sem malesuada magna mollis euismod. Aenean lacinia bibendum nulla sed consectetur. Etiam porta sem malesuada magna mollis euismod. Etiam porta sem malesuada magna mollis euismod. Vestibulum id ligula porta felis euismod semper.`

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
    coverImage: '/uploads/default-cover.jpg',
    title: {
      en: 'Title - en',
      fr: 'Title - fr',
      es: 'Title - es',
      ar: 'Title - ar',
    },
    content: {
      en: '[en] ' + loremIpsum,
      fr: '[fr] ' + loremIpsum,
      es: '[es] ' + loremIpsum,
      ar: '[ar] ' + loremIpsum,
    },
    links: [],
    enableTranslation: translated,
    speakers: [],
    hostName: 'Geoff Testington',
    hostEmail: 'user@example.com',
    hostLanguage: translated ? badShuffle(['en', 'fr', 'es', 'ar']) : [locale],
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
        'https://zoom.us/my/robjanderson',
        'https://teams.microsoft.com/l/meetup-join/19%3ameeting_MzliMDhmNDUtZjAwNS00NjQ5LWJkYzMtNTE2NTNhOTY0ZTAw%40thread.v2/0?context=%7b%22Tid%22%3a%229c5012c9-b616-44c2-a917-66814fbe3e87%22%2c%22Oid%22%3a%22ce849a55-9a39-48ec-a3a5-c2371bbc5c68%22%7d',
      ]),
    })

    session.links.push({
      type: 'misc',
      language: '*',
      url:
        'https://drive.google.com/drive/folders/1Il2sflOFfFm3F18Z9xmso3JP1nBWaCzw',
    })
    session.links.push({
      type: 'misc',
      language: '*',
      url: 'https://www.notion.so/Dev-75774e00964b427da478f7a528cd052a',
    })
    session.links.push({
      type: 'misc',
      language: '*',
      url: 'https://miro.com/app/board/o9J_kryT8jc=/',
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
