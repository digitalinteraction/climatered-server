import { Session, Slot } from '../structs'
import { Registration } from '../services/users'

//
// Functions to generate data for testing
//

export const createSlot = (id: string, start: number): Slot => ({
  id: id,
  start: new Date(`2020-06-15T${start}:00:00.000Z`),
  end: new Date(`2020-06-15T${start + 1}:00:00.000Z`),
})

export const createSession = (
  id: string,
  type: string,
  slot: string | undefined,
  translated: boolean
): Session => ({
  id,
  type: type,
  slot,
  track: 'act',
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
  hostLanguage: 'en',
  enableTranslation: translated,
  speakers: [],
  hostOrganisation: undefined,
  isRecorded: false,
  attendeeInteraction: 'view',
  attendeeDevices: 'all',
})

export const createRegistration = (roles: string[]): Registration => ({
  name: 'Geoff Testington',
  email: 'user@example.com',
  language: 'en',
  roles,
})
