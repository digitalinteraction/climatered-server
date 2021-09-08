import {
  ConferenceConfigStruct,
  DeconfConfigStruct,
  loadConfig as loadDeconfConfig,
} from '@openlab/deconf-api-toolkit'
import { DeconfConfig } from '@openlab/deconf-shared'

import { object, assign, Infer, Describe } from 'superstruct'

export type AppConfig = DeconfConfig

export const AppConfigStruct: Describe<DeconfConfig> = DeconfConfigStruct
// export const AppConfigStruct = assign(
//   DeconfConfigStruct,
//   object({
//     conference: ConferenceConfigStruct,
//   })
// )

export function loadConfig() {
  return loadDeconfConfig('app-config.json', AppConfigStruct)
}
