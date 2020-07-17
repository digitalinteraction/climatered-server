import slots = require('../data/slots.json')
import events = require('../data/events.json')
// import registrations = require('../data/registrations.json')

type t = typeof events

export interface Slot {
  id: string
  start: Date
  end: Date
}

export interface Link {
  type: string
  url: string
  language: string
}

export interface ScheduleEvent {
  id: string
  name: string
  type: 'plenary' | 'panel' | 'session'
  slot: string
  title: {
    en: string
    fr: string
    es: string
    ar: string
  }
  content: {
    en: string
    fr: string
    es: string
    ar: string
  }
  links: Link[]
  hostLanguage: string
  enableTranslation: boolean
}

export interface ScheduleService {
  getSlots(): Promise<Slot[]>
  getEvents(): Promise<ScheduleEvent[]>
}

export function createScheduleService(): ScheduleService {
  const parsedSlots = slots.map((s) => ({
    id: s.id,
    start: new Date(s.start),
    end: new Date(s.end),
  }))

  return {
    getSlots: async () => parsedSlots,
    getEvents: async () => events as any,
  }
}