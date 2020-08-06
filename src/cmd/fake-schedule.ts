import createDebug = require('debug')

const debug = createDebug('api:cmd:fake-schedule')

import { createSlot, createSession } from '../test-utils/fixtures'
import { runScraper } from './scrape-content'
import { createRedisService } from '../services/redis'
import validateEnv from 'valid-env'

interface FakeScheduleArgs {}

function createSpeaker(name: string, role: string) {
  return { name, role, headshot: '/uploads/speaker-default.svg' }
}

const tracks = {}

export async function fakeSchedule(args: FakeScheduleArgs = {}) {
  debug('#fakeSchedule args=%O', args)

  validateEnv(['REDIS_URL'])
  const { REDIS_URL } = process.env as Record<string, string>

  const redis = createRedisService(REDIS_URL)

  // Run the normal scraper to seed slots, tracks & themes
  await runScraper()

  const sessions = [
    createSession('opening-plenary', 'plenary', undefined, true),
    createSession('panel', 'panel', undefined, true),
    createSession('ignite-talk', 'ignite-talk', undefined, true),
    createSession('games', 'games', undefined, true),
    createSession('workshop', 'workshop', undefined, true),
    createSession('virtual-tour', 'virtual-tour', undefined, true),
    createSession('speaker', 'speaker', undefined, true),
    createSession('fishbowl', 'fishbowl', undefined, true),
  ]

  const speakers = [
    createSpeaker('Geoff Testington', 'CEO Banana Corp'),
    createSpeaker('Heather Wisely', 'CTO Orange Digital'),
    createSpeaker('Sulayman Mathis', 'CFO Lemon Bros'),
    createSpeaker('Elen Foster', 'Partner at Pineapple Ltd'),
  ]

  await redis.set('schedule.sessions', JSON.stringify(sessions))
  await redis.set('schedule.speakers', JSON.stringify(speakers))

  await redis.quit()
}
