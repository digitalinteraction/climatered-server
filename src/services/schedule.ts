// import slots = require('../data/slots.json')
// import events = require('../data/events.json')
// import registrations = require('../data/registrations.json')

import { Session, Slot, SlotStruct, SlotJson } from '../structs'
import { RedisService } from './redis'

export interface ScheduleService {
  getSlots(): Promise<Slot[]>
  getSessions(): Promise<Session[]>
  findSession(id: string): Promise<Session | null>
}

export function createScheduleService(redis: RedisService): ScheduleService {
  async function getSlots(): Promise<Slot[]> {
    const raw = await redis.get('schedule.slots')
    if (!raw) return []

    const jsonSlots: SlotJson[] = JSON.parse(raw)

    return jsonSlots.map((s) => ({
      id: s.id,
      start: new Date(s.start),
      end: new Date(s.end),
    }))
  }

  async function getSessions(): Promise<Session[]> {
    const raw = await redis.get('schedule.sessions')
    if (!raw) return []
    return JSON.parse(raw)
  }

  async function findSession(id: string) {
    const sessions = await getSessions()
    return sessions.find((s) => s.id === id) ?? null
  }

  return {
    getSlots,
    getSessions,
    findSession,
  }
}
