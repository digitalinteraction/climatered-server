import {
  ConferenceConfigStruct,
  DeconfConfigStruct,
  loadConfig as loadDeconfConfig,
} from '@openlab/deconf-api-toolkit'

import { object, assign, Infer } from 'superstruct'

export type AppConfig = Infer<typeof AppConfigStruct>

export const AppConfigStruct = assign(
  DeconfConfigStruct,
  object({
    conference: ConferenceConfigStruct,
  })
)

export function loadConfig() {
  return loadDeconfConfig('app-config.json', AppConfigStruct)
}
