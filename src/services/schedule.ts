import {
  Session,
  Slot,
  SlotStruct,
  SlotJson,
  Speaker,
  Track,
  Theme,
  ConfigSettings,
  SessionType,
  Translator,
} from '../structs'
import { RedisService } from './redis'

/**
 * A service for fetching schedule information for the conference
 */
export interface ScheduleService {
  getSlots(): Promise<Slot[]>
  getSessions(): Promise<Session[]>
  findSession(id: string): Promise<Session | null>
  getTracks(): Promise<Track[]>
  getThemes(): Promise<Theme[]>
  getSpeakers(): Promise<Speaker[]>
  getTypes(): Promise<SessionType[]>
  getSettings(): Promise<ConfigSettings | null>
  getTranslators(): Promise<Translator[]>
  findTranslator(email: string): Promise<Translator | null>
}

export function createScheduleService(redis: RedisService): ScheduleService {
  async function getSlots(): Promise<Slot[]> {
    const slots = await redis.getJson<SlotJson[]>('schedule.slots', [])
    if (!slots) return []

    return slots.map((s) => ({
      slug: s.slug,
      id: s.id,
      start: new Date(s.start),
      end: new Date(s.end),
    }))
  }

  const getSessions = () => redis.getJson('schedule.sessions', [])
  const getTracks = () => redis.getJson('schedule.tracks', [])
  const getThemes = () => redis.getJson('schedule.themes', [])
  const getSpeakers = () => redis.getJson('schedule.speakers', [])
  const getTypes = () => redis.getJson('schedule.types', [])
  const getTranslators = () => redis.getJson('schedule.translators', [])
  const getSettings = () => redis.getJson('schedule.settings', null)

  async function findSession(id: string) {
    const sessions: Session[] = await getSessions()
    return sessions.find((s) => s.id === id) ?? null
  }

  async function findTranslator(email: string) {
    const translators: Translator[] = await getTranslators()
    return translators.find((t) => t.email === email) ?? null
  }

  return {
    getSlots,
    getSessions,
    findSession,
    getTracks,
    getThemes,
    getSpeakers,
    getTypes,
    getSettings,
    getTranslators,
    findTranslator,
  }
}
