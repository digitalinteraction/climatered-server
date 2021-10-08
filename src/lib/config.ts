import {
  DeconfConfigStruct,
  loadConfig as loadDeconfConfig,
} from '@openlab/deconf-api-toolkit'
import { DeconfConfig } from '@openlab/deconf-shared'

import {
  object,
  assign,
  Infer,
  string,
  Describe,
  number,
  array,
  record,
  optional,
} from 'superstruct'

const localisedQuestion = () =>
  object({
    en: number(),
    fr: number(),
    es: number(),
    ar: number(),
  })

const localised = () =>
  object({
    en: string(),
    fr: string(),
    es: string(),
    ar: string(),
  })

export type PretalxConfig = Infer<typeof PretalxConfigStruct>

export const PretalxConfigStruct = object({
  eventSlug: string(),
  englishKeys: array(string()),
  questions: object({
    theme: number(),
    title: localisedQuestion(),
    description: localisedQuestion(),
    links: object({
      en: array(number()),
      fr: array(number()),
      es: array(number()),
      ar: array(number()),
    }),
    interpretation: number(),
    capacity: number(),
    languages: number(),
    recorded: number(),
    speakerAffiliation: number(),
    sessionOrganisation: number(),
    speakerOrganisation: number(),
    contactEmail: number(),
  }),
  languages: record(string(), optional(string())),
  types: array(
    object({
      id: string(),
      iconGroup: string(),
      iconName: string(),
      layout: string(),
      title: localised(),
    })
  ),
})

export type AppConfig = DeconfConfig & {
  sendgrid: {
    templateId: string
  }
  pretalx: Infer<typeof PretalxConfigStruct>
}

export const AppConfigStruct: Describe<AppConfig> = assign(
  DeconfConfigStruct,
  object({
    sendgrid: object({
      templateId: string(),
    }),
    pretalx: PretalxConfigStruct,
  })
)

export function loadConfig() {
  return loadDeconfConfig('app-config.json', AppConfigStruct)
}
