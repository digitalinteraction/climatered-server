import { createEnv as createDeconfEnv } from '@openlab/deconf-api-toolkit'
import { checkEnvObject, pluck } from 'valid-env'

export type EnvRecord = ReturnType<typeof createEnv>

export function createEnv(processEnv = process.env) {
  const { REDIS_URL = null } = process.env
  return {
    ...createDeconfEnv(processEnv),
    REDIS_URL,
    // ...checkEnvObject(
    //   pluck(processEnv, 'SOME_KEY')
    // )
  }
}
