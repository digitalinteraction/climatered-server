import yargs = require('yargs')
import jwt = require('jsonwebtoken')
import { validateEnv } from 'valid-env'
import { runServer } from './server'
import { runScraper } from './cmd/scrape-content'
import { runMigrator } from './cmd/migrate'
import { runRebuilder } from './cmd/rebuild-audio'
import { runGeocode } from './cmd/geocode'
import { AuthJwt } from './test-utils'
import { fakeSchedule } from './cmd/fake-schedule'
import { appendUrl } from './services/url'

yargs.help().alias('h', 'help').demandCommand().recommendCommands()

function fail(error: any) {
  console.error(error)
  process.exit(1)
}

function handleFail<T extends any[]>(block: (...args: T) => Promise<any>) {
  return async (...args: T) => {
    try {
      await block(...args)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
}

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
  handleFail(async (args) => {
    if (args.migrate) await runMigrator()
    if (args.scrape) await runScraper()

    await runServer()
  })
)

yargs.command(
  'scrape-content',
  'Scrape content from GitHub and put into redis',
  (yargs) => yargs,
  async (args) => {
    try {
      await runScraper()
    } catch (error) {
      fail(error)
    }
  }
)

yargs.command(
  'migrate',
  'Run the database migrator',
  (yargs) => yargs,
  handleFail(async (args) => {
    await runMigrator()
  })
)

yargs.command(
  'fake-auth',
  'Generate an auth token',
  (yargs) =>
    yargs
      .option('email', {
        type: 'string',
        default: 'robanderson@hey.com',
      })
      .option('lang', {
        type: 'string',
        default: 'en',
        choices: ['en', 'fr', 'es', 'ar'],
      })
      .option('url', {
        type: 'boolean',
        default: false,
      }),
  handleFail(async (args) => {
    validateEnv(['JWT_SECRET'])
    const auth: AuthJwt = {
      typ: 'auth',
      sub: args.email,
      user_roles: ['translator', 'attendee'],
      user_lang: args.lang,
    }
    const token = jwt.sign(auth, process.env.JWT_SECRET!)
    if (args.url) {
      validateEnv(['WEB_URL'])
      const base = new URL(process.env.WEB_URL!)
      console.log(appendUrl(base, `/_token?token=${token}`).toString())
    } else {
      console.log(token)
    }
  })
)

yargs.command(
  'rebuild-audio <path> <file>',
  'Rebuild audio in a given folder',
  (yargs) =>
    yargs
      .positional('path', { type: 'string', demandOption: true })
      .positional('file', { type: 'string', demandOption: true }),
  handleFail(async (args) => {
    await runRebuilder(args.path, args.file)
  })
)

yargs.command(
  'fake-schedule',
  'Generate a fake schedule and put it into redis',
  (yargs) => yargs,
  handleFail(async (args) => {
    await fakeSchedule()
  })
)

yargs.command(
  'geocode',
  'Generate countries geocoded json',
  (yargs) => yargs,
  handleFail(async (args) => {
    await runGeocode()
  })
)

yargs.parse()
