import yargs = require('yargs')
import jwt = require('jsonwebtoken')
import { validateEnv } from 'valid-env'
import { runServer } from './server'
import { runScraper } from './cmd/scrape-content'
import { runMigrator } from './cmd/migrate'

yargs.help().alias('h', 'help').demandCommand().recommendCommands()

yargs.command(
  'serve',
  'Run the api server',
  (yargs) =>
    yargs
      .option('migrate', {
        type: 'boolean',
        describe: 'Run database migrations',
        default: false,
      })
      .option('scrape', {
        type: 'boolean',
        describe: 'Scrape content from the repo',
        default: false,
      }),
  async (args) => {
    try {
      if (args.migrate) await runMigrator()
      if (args.scrape) await runScraper()

      await runServer()
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
)

yargs.command(
  'scrape-content',
  'Scrape content from GitHub and put into redis',
  (yargs) => yargs,
  async (args) => {
    try {
      await runScraper()
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
)

yargs.command(
  'migrate',
  'Run the database migrator',
  (yargs) => yargs,
  async (args) => {
    try {
      await runMigrator()
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
)

yargs.command(
  'fake-auth',
  '',
  (yargs) => yargs,
  (args) => {
    validateEnv(['JWT_SECRET'])
    console.log(
      jwt.sign({ typ: 'auth', sub: 'rob@andrsn.uk' }, process.env.JWT_SECRET!)
    )
  }
)

yargs.parse()
