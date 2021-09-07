import {
  DECONF_MIGRATIONS,
  MigrateRepository,
  MigrateService,
  PostgresService,
} from '@openlab/deconf-api-toolkit'
import { createEnv, createDebug } from '../lib/module.js'

const debug = createDebug('cr:cmd:migrate')

export interface MigrateCommandOptions {
  // ...
}

const CLIMATERED_MIGRATIONS = [...DECONF_MIGRATIONS]

export async function migrateCommand(options: MigrateCommandOptions) {
  debug('start')

  const env = createEnv()

  debug('url %o', env.DATABASE_URL)
  debug(
    'migrations %o',
    CLIMATERED_MIGRATIONS.map((m) => m.id)
  )

  const postgres = new PostgresService({ env })

  await postgres.run(async (client) => {
    const migrateRepo = new MigrateRepository(client)
    const migrate = new MigrateService({ migrateRepo })

    await migrate.runMigrations(CLIMATERED_MIGRATIONS)
  })

  await postgres.close()
}
