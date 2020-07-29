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
} from 'superstruct'

//
// Slot
//
export type Slot = StructType<typeof SlotStruct>
export interface SlotJson {
  id: string
  start: string
  end: string
}

export const SlotStruct = object({
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
})

//
// Link
//
export type Link = StructType<typeof LinkStruct>
export const LinkStruct = object({
  type: enums(['video', 'poll', 'tool']),
  url: string(),
  language: string(),
})

//
// Session
//
export type Session = StructType<typeof SessionStruct>
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
export type Speaker = StructType<typeof SpeakerStruct>
export const SpeakerStruct = object({
  name: string(),
  role: string(),
  headshot: string(),
})

//
// Track
//
export type Track = StructType<typeof TrackStruct>
export const TrackStruct = object({
  id: string(),
  title: LocalisedStruct,
})

//
// Theme
//
export type Theme = StructType<typeof ThemeStruct>
export const ThemeStruct = object({
  id: string(),
  title: LocalisedStruct,
})

//
// Translator
//
export type Translator = StructType<typeof TranslatorStruct>
export const TranslatorStruct = object({
  name: string(),
  email: string(),
})

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
  language: enums(['en', 'fr', 'es', 'ar']),
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
