import {
  KeyValueService,
  PostgresService,
  ResourcesMap,
  UrlService,
  DeconfBaseContext,
} from '@openlab/deconf-api-toolkit'

import { AppConfig } from './config'
import { EnvRecord } from './env'
import { EmailService } from './email-service'

// prettier-ignore
type Contexify<T> = T extends object 
  ? { [K in keyof T]: Readonly<T[K]> }
  : T

export type AppContext = Omit<DeconfBaseContext, 'config' | 'env' | 'email'> & {
  config: AppConfig
  env: EnvRecord
  pkg: {
    name: string
    version: string
  }
  email: Readonly<EmailService>
}
