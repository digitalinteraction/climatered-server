import {
  Session,
  Slot,
  SlotStruct,
  SlotJson,
  Speaker,
  Track,
  Theme,
} from '../structs'
import { RedisService } from './redis'

export interface ScheduleService {
  getSlots(): Promise<Slot[]>
  getSessions(): Promise<Session[]>
  findSession(id: string): Promise<Session | null>
  getTracks(): Promise<Track[]>
  getThemes(): Promise<Theme[]>
  getSpeakers(): Promise<Speaker[]>
}

export function createScheduleService(redis: RedisService): ScheduleService {
  async function getJson(key: string) {
    const raw = await redis.get('schedule.slots')
    if (!raw) return []

    return JSON.parse(raw)
  }

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

  const getSessions = () => getJson('schedule.sessions')
  const getTracks = () => getJson('schedule.tracks')
  const getThemes = () => getJson('schedule.themes')
  const getSpeakers = () => getJson('schedule.speakers')

  async function findSession(id: string) {
    const sessions: Session[] = await getSessions()
    return sessions.find((s) => s.id === id) ?? null
  }

  return {
    getSlots,
    getSessions,
    findSession,
    getTracks,
    getThemes,
    getSpeakers,
  }
}
