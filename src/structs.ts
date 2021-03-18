import {
  number,
  string,
  object,
  array,
  boolean,
  date,
  optional,
  enums,
  StructType,
} from 'superstruct'

import countries = require('i18n-iso-countries')

export {
  is as isStruct,
  assert as assertStruct,
  validate as validateStruct,
  coerce as coerceStruct,
  Struct,
} from 'superstruct'

//
// Slot
//
export type Slot = StructType<typeof SlotStruct>
export interface SlotJson {
  slug: string
  id: string
  start: string
  end: string
}

export const SlotStruct = object({
  slug: string(),
  id: string(),
  start: date(),
  end: date(),
})

//
// Localised
//
export type Localised = StructType<typeof LocalisedStruct>
export const LocalisedStruct = object({
  en: string(),
  fr: string(),
  es: string(),
  ar: string(),
  sw: string(),
})

//
// Link
//
export type Link = StructType<typeof LinkStruct>
export const LinkStruct = object({
  type: enums(['video', 'poll', 'tool', 'vimeo-chat']),
  url: string(),
  title: optional(string()),
  language: string(),
})

//
// Session
//
export type Session = StructType<typeof SessionStruct>
export const SessionStruct = object({
  slug: string(),
  id: string(),
  type: string(),
  slot: optional(string()),
  track: string(),
  themes: array(string()),
  coverImage: string(),
  title: LocalisedStruct,
  content: LocalisedStruct,
  links: array(LinkStruct),
  hostName: string(),
  hostEmail: string(),
  hostLanguage: array(string()),
  enableTranslation: boolean(),
  speakers: array(string()),
  hostOrganisation: LocalisedStruct,
  isRecorded: boolean(),
  attendeeInteraction: enums(['view', 'q-and-a', 'workshop', 'games']),
  attendeeDevices: enums(['desktop', 'mobile', 'all']),
  isOfficial: boolean(),
  isDraft: boolean(),
  isFeatured: boolean(),
  proxyUrl: string(),
  hideFromSchedule: optional(boolean()),
  isCancelled: optional(boolean()),
  isPublic: optional(boolean()),
})

//
// Speaker
//
export type Speaker = StructType<typeof SpeakerStruct>
export const SpeakerStruct = object({
  slug: string(),
  name: string(),
  role: LocalisedStruct,
  bio: LocalisedStruct,
  headshot: string(),
})

//
// Track
//
export type Track = StructType<typeof TrackStruct>
export const TrackStruct = object({
  slug: string(),
  id: string(),
  title: LocalisedStruct,
})

//
// Theme
//
export type Theme = StructType<typeof ThemeStruct>
export const ThemeStruct = object({
  slug: string(),
  id: string(),
  title: LocalisedStruct,
})

//
// Type
//
export type SessionType = StructType<typeof SessionTypeStruct>
export const SessionTypeStruct = object({
  slug: string(),
  id: string(),
  icon: string(),
  layout: string(),
  title: LocalisedStruct,
})

//
// Translator
//
export type Translator = StructType<typeof TranslatorStruct>
export const TranslatorStruct = object({
  slug: string(),
  name: string(),
  email: string(),
})

//
// Channels
//
export const ChannelStruct = enums(['en', 'fr', 'es', 'ar'])

//
// Registration
//
const countryCodes = Object.keys(countries.getNames('en'))

export type Registration = StructType<typeof RegistrationStruct>
export const RegistrationStruct = object({
  id: number(),
  created: date(),
  name: string(),
  email: string(),
  language: ChannelStruct,
  country: enums(countryCodes),
  affiliation: string(),
  verified: boolean(),
  consented: date(),
})

//
// RegisterBody - the fields needed to register
//
export type RegisterBody = StructType<typeof RegisterBodyStruct>
export const RegisterBodyStruct = object({
  name: string(),
  email: string(),
  language: string(),
  country: enums(countryCodes),
  affiliation: string(),
})

//
// ConfigSettings
//
const featureStates = ['ENABLE', 'DISABLE', 'HIDE']

export type ConfigSettings = StructType<typeof ConfigSettingsStruct>
export const ConfigSettingsStruct = object({
  scheduleLive: boolean(),
  schedule: enums(featureStates),
  coffeechat: enums(featureStates),
  explore: enums(featureStates),
  helpdesk: enums(featureStates),
  conferenceIsOver: boolean(),
})

//
// SessionChannel
//
export type SessionChannel = StructType<typeof SessionChannelStruct>
export const SessionChannelStruct = object({
  sessionId: string(),
  channel: ChannelStruct,
})

//
// Attendance
//
export type Attendance = StructType<typeof AttendanceStruct>
export const AttendanceStruct = object({
  id: number(),
  created: date(),
  attendee: number(),
  session: string(),
})
