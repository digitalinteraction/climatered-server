import { Session, Slot, Registration, Speaker } from '../structs'
import { AuthJwt } from '../services/jwt'

//
// Functions to generate data for testing
//

export const createSlot = (id: string, start: number): Slot => ({
  slug: id,
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
  slug: id,
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

export const createSpeaker = (name: string, role: string): Speaker => ({
  slug: name.replace(/\s+/g, '-').toLowerCase(),
  name,
  role,
  headshot: '/uploads/speaker-default.svg',
})

export const createRegistration = (): Registration => ({
  id: 1,
  created: new Date(),
  name: 'Geoff Testington',
  email: 'user@example.com',
  language: 'en',
  country: 'GB',
  affiliation: 'Open Lab',
  verified: true,
  consented: new Date(),
})

export const createAuthToken = (roles: string[]): AuthJwt => ({
  typ: 'auth',
  sub: 'user@example.com',
  user_roles: roles,
  user_lang: 'en',
})
