import { validateEnv } from 'valid-env'

export type Env = ReturnType<typeof createEnv>

export function createEnv(processEnv: Record<string, string | undefined>) {
  validateEnv([
    'SENDGRID_API_KEY',
    'SENDGRID_FROM',
    'JWT_SECRET',
    'SELF_URL',
    'WEB_URL',
    'REDIS_URL',
  ])

  const {
    NODE_ENV = 'production',
    SENDGRID_API_KEY,
    SENDGRID_FROM,
    JWT_SECRET,
    SELF_URL,
    WEB_URL,
    REDIS_URL,
  } = processEnv as Record<string, string>

  const CORS_HOSTS = processEnv.CORS_HOSTS?.split(',') ?? []

  return {
    NODE_ENV,
    CORS_HOSTS,
    SENDGRID_API_KEY,
    SENDGRID_FROM,
    JWT_SECRET,
    SELF_URL,
    WEB_URL,
    REDIS_URL,
  }
}
