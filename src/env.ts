import { validateEnv } from 'valid-env'

export type Env = ReturnType<typeof createEnv>

export function createEnv(processEnv: Record<string, string | undefined>) {
  validateEnv([
    'SENDGRID_API_KEY',
    'SENDGRID_FROM',
    'SENDGRID_TRANSACTIONAL_TEMPLATE_ID',
    'JWT_SECRET',
    'SELF_URL',
    'WEB_URL',
    'REDIS_URL',
    'SQL_URL',
    'SPACES_KEY',
    'SPACES_SECRET',
    'SPACES_BUCKET',
  ])

  const {
    NODE_ENV = 'production',
    SENDGRID_API_KEY,
    SENDGRID_FROM,
    SENDGRID_TRANSACTIONAL_TEMPLATE_ID,
    JWT_SECRET,
    SELF_URL,
    WEB_URL,
    REDIS_URL,
    SQL_URL,
    SPACES_KEY,
    SPACES_SECRET,
    SPACES_ENDPOINT = 'ams3.digitaloceanspaces.com',
    SPACES_BUCKET,
  } = processEnv as Record<string, string>

  const ENABLE_ACCESS_LOGS = Boolean(process.env.ENABLE_ACCESS_LOGS)
  const ENABLE_EVENT_LOGS = Boolean(process.env.ENABLE_EVENT_LOGS)
  const CORS_HOSTS = processEnv.CORS_HOSTS?.split(',') ?? []

  return {
    NODE_ENV,
    CORS_HOSTS,
    SENDGRID_API_KEY,
    SENDGRID_FROM,
    SENDGRID_TRANSACTIONAL_TEMPLATE_ID,
    JWT_SECRET,
    SELF_URL,
    WEB_URL,
    REDIS_URL,
    ENABLE_ACCESS_LOGS,
    SQL_URL,
    SPACES_ENDPOINT,
    SPACES_KEY,
    SPACES_SECRET,
    SPACES_BUCKET,
    ENABLE_EVENT_LOGS,
  }
}

export function createTestEnv(): Env {
  return {
    NODE_ENV: 'development',
    CORS_HOSTS: [],
    SENDGRID_API_KEY: 'localhost_fake_key',
    SENDGRID_FROM: 'admin@example.com',
    JWT_SECRET: 'not_top_secret',
    SELF_URL: 'http://api.localhost',
    WEB_URL: 'http://web.localhost',
    REDIS_URL: 'redis://localhost',
    ENABLE_ACCESS_LOGS: false,
    SQL_URL: 'postgresql://user:secret@localhost:5432/test',
    SENDGRID_TRANSACTIONAL_TEMPLATE_ID: 'aaabbbcccdddeeefff',
    SPACES_ENDPOINT: 'nyc3.digitaloceanspaces.com',
    SPACES_KEY: 'fake-spaces-key',
    SPACES_SECRET: 'fake-spaces-secret',
    SPACES_BUCKET: 'fake-bucket',
    ENABLE_EVENT_LOGS: true,
  }
}
