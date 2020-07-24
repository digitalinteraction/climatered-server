import {
  string,
  object,
  array,
  boolean,
  date,
  optional,
  enums,
} from 'superstruct'

export {
  is as isStruct,
  assert as assertStruct,
  validate as validateStruct,
  coerce as coerceStruct,
} from 'superstruct'

//
// Slot
//
export type Slot = typeof SlotStruct.schema
export const SlotStruct = object({
  id: string(),
  start: date(),
  end: date(),
})

//
// Localised
//
export type Localised = typeof LocalisedStruct.schema
export const LocalisedStruct = object({
  en: string(),
  fr: string(),
  es: string(),
  ar: string(),
})

//
// Link
//
export type Link = typeof LinkStruct.schema
export const LinkStruct = object({
  type: enums(['video', 'poll', 'tool']),
  url: string(),
  language: string(),
})

//
// Session
//
export type Session = typeof SessionStruct.schema
export const SessionStruct = object({
  id: string(),
  type: enums([
    'ignite-talk',
    'games',
    'panel',
    'workshop',
    'virtual-tour',
    'plenary',
    'speaker',
    'fishbowl',
  ]),
  slot: optional(string()),
  track: string(),
  themes: array(string()),
  title: LocalisedStruct,
  content: LocalisedStruct,
  links: array(LinkStruct),
  hostLanguage: string(),
  enableTranslation: boolean(),
  speakers: array(string()),
  hostOrganisation: optional(string()),
  isRecorded: boolean(),
  attendeeInteraction: enums(['interactive', 'view']),
  attendeeDevices: enums(['desktop', 'mobile', 'all']),
})

//
// Speaker
//
export type Speaker = typeof SpeakerStruct.schema
export const SpeakerStruct = object({
  name: string(),
  role: string(),
  headshot: string(),
})

//
// Track
//
export type Track = typeof TrackStruct.schema
export const TrackStruct = object({
  id: string(),
  title: LocalisedStruct,
})

//
// Theme
//
export type Theme = typeof ThemeStruct.schema
export const ThemeStruct = object({
  id: string(),
  title: LocalisedStruct,
})

//
// Translator
//
export type Translator = typeof TranslatorStruct.schema
export const TranslatorStruct = object({
  name: string(),
  email: string(),
})
