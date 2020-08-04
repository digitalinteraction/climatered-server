import createDebug = require('debug')
import { validateEnv } from 'valid-env'
import { createPostgresService, PoolClient } from '../services/postgres'

const debug = createDebug('api:cmd:migrate')

interface MigrationFn {
  (client: PoolClient): Promise<void>
}

interface Migration {
  id: number
  name: string
  created: Date
}

/**
 * Setup migrations table if it doesn't exist,
 * then run any migrations that haven't been run
 */
export async function runMigrator() {
  debug('#runMigrator')
  validateEnv(['SQL_URL'])

  debug(`sqlUrl=${process.env.SQL_URL}`)
  const pg = createPostgresService(process.env.SQL_URL!)

  await pg.run(async (client) => {
    debug('connected')

    await runMigrations(client, {
      addAttendees,
    })
  })

  await pg.close()

  debug('done')
}

/** Run a record of migrations against a sql client */
async function runMigrations(
  client: PoolClient,
  toMigrate: Record<string, MigrationFn>
) {
  const migrations = await getOrSetupMigrations(client)

  for (const [key, exec] of Object.entries(toMigrate)) {
    if (migrations.has(key)) {
      debug(`skip "%s"`, key)
      continue
    }

    debug(`run "%s"`, key)
    await migrate(client, key, exec)
  }
}

/** Get previous migrations or setup the migration table if it doesn't exist */
async function getOrSetupMigrations(client: PoolClient): Promise<Set<string>> {
  type Table = { name: string }

  // Check for the migrations table
  const tables = await client.sql<Table>`
    SELECT table_name as name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `

  debug(
    `tables=%o`,
    tables.map((t) => t.name)
  )

  // If the migrations table doesn't exist, create it
  if (tables.every((t) => t.name !== 'migrations')) {
    debug('Adding migrations table')
    await client.sql`
      CREATE TABLE "migrations" (
        "id" serial PRIMARY KEY,
        "name" varchar(50) NOT NULL,
        "created" timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `

    return new Set()
  }

  // Query for previous migrations
  const migrations = await client.sql<Migration>`
    SELECT id, name, created
    FROM migrations
  `

  debug(
    `found=%o`,
    migrations.map((m) => m.name)
  )

  // Reduce the migrations to a Set of migration names
  return migrations.reduce((set, migration) => {
    set.add(migration.name)
    return set
  }, new Set<string>())
}

/** Run a migration and save a record in the migrations table */
async function migrate(client: PoolClient, name: string, exec: MigrationFn) {
  try {
    await client.sql`BEGIN`

    // Run the migration function
    debug(`run %s`, name)
    await exec(client)

    // Add a migration record to remember its been run
    debug(`add migration %s`, name)
    await client.sql`
      INSERT INTO migrations (name)
      VALUES (${name})
    `

    await client.sql`COMMIT`
  } catch (error) {
    console.error('Failed to migrate', name)
    console.error(error)

    await client.sql`ROLLBACK`
  }
}

//
// Migrations
//
async function addAttendees(client: PoolClient) {
  await client.sql`
    CREATE TABLE "attendees" (
      "id" serial PRIMARY KEY,
      "created" timestamp DEFAULT CURRENT_TIMESTAMP,
      "name" varchar(50) NOT NULL,
      "email" varchar(100) NOT NULL,
      "language" varchar(2) NOT NULL,
      "country" varchar(2) NOT NULL,
      "affiliation" varchar(255) NOT NULL,
      "verified" boolean DEFAULT false,
      "consented" timestamp DEFAULT CURRENT_TIMESTAMP
    );
  `
}
