import {
  DECONF_MIGRATIONS,
  MigrateRepository,
  MigrateService,
  PostgresService,
} from '@openlab/deconf-api-toolkit'
import { createEnv } from '../lib/module'

export interface MigrateCommandOptions {
  // ...
}

const CLIMATERED_MIGRATIONS = [...DECONF_MIGRATIONS]

export async function migrateCommand(options: MigrateCommandOptions) {
  const env = createEnv()

  const postgres = new PostgresService({ env })

  await postgres.run(async (client) => {
    const migrateRepo = new MigrateRepository(client)
    const migrate = new MigrateService({ migrateRepo })

    await migrate.runMigrations(CLIMATERED_MIGRATIONS)
  })

  await postgres.close()
}
