import {
  ConferenceConfigStruct,
  DeconfBaseContext,
  DeconfConfigStruct,
  loadConfig as loadDeconfConfig,
} from '@openlab/deconf-api-toolkit'
import { DeconfConfig } from '@openlab/deconf-shared'

import { object, assign, Infer, string, Describe } from 'superstruct'

// export type AppConfig = Infer<typeof AppConfigStruct>

export type AppConfig = DeconfConfig & {
  sendgrid: {
    templateId: string
  }
}

// export const AppConfigStruct: Describe<DeconfConfig> = DeconfConfigStruct
export const AppConfigStruct: Describe<AppConfig> = assign(
  DeconfConfigStruct,
  object({
    sendgrid: object({
      templateId: string(),
    }),
  })
)

export function loadConfig() {
  return loadDeconfConfig('app-config.json', AppConfigStruct)
}
