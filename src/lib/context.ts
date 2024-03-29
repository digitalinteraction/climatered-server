import { DeconfBaseContext } from '@openlab/deconf-api-toolkit'

import { AppConfig } from './config'
import { EnvRecord } from './env'
import { EmailService } from './email-service'
import { SocketService } from './sockets-service'
import { UrlService } from './url-service'
import { MetricsRepository } from '../metrics/metrics-repository'

// prettier-ignore
type Contexify<T> = T extends object 
  ? { [K in keyof T]: Readonly<T[K]> }
  : T

//
// Create a shared context for climatered code
// Any overrides should be "Omit"-ed and added below
//
export type AppContext = Omit<
  DeconfBaseContext,
  'config' | 'env' | 'email' | 'sockets' | 'url' | 'metricsRepo'
> & {
  config: AppConfig
  env: EnvRecord
  pkg: {
    name: string
    version: string
  }
  email: Readonly<EmailService>
  sockets: Readonly<SocketService>
  url: Readonly<UrlService>
  metricsRepo: Readonly<MetricsRepository>
}
