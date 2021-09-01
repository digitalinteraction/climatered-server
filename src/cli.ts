#!/usr/bin/env node

//
// The cli entrypoint
//

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { devAuthCommand } from './cmd/dev-auth-command'
import { migrateCommand } from './cmd/migrate-command'
import {
  pretalxDataCommand,
  pretalxDataCommands,
} from './cmd/pretalx-data-command'
import { scrapePretalxCommand } from './cmd/scrape-pretalx-command'
import { serveCommand } from './cmd/serve-command'

const cli = yargs(hideBin(process.argv))

cli
  .help()
  .alias('h', 'help')
  .demandCommand(1, 'A command is required')
  .recommendCommands()

function errorHandler(error: any) {
  console.error('Fatal error')
  console.error(error)
  process.exit(1)
}

yargs.command(
  'serve',
  'Run the server',
  (yargs) =>
    yargs.option('port', {
      type: 'number',
      describe: 'The port to run the server on',
      default: 3000,
    }),
  (args) => serveCommand(args).catch(errorHandler)
)

yargs.command(
  'scrape-pretalx',
  'Scrape content from pretalx and put into redis',
  (yargs) => yargs,
  (args) => scrapePretalxCommand(args).catch(errorHandler)
)

yargs.command(
  'pretalx <data>',
  'Fetch and output data from pretalx',
  (yargs) =>
    yargs.positional('data', {
      type: 'string',
      choices: Object.keys(pretalxDataCommands),
      demandOption: true,
    }),
  (args) => pretalxDataCommand(args).catch(errorHandler)
)

yargs.command(
  'dev-auth',
  'Generate an authentication for local Development',
  (yargs) =>
    yargs
      .option('email', { type: 'string', demandOption: true })
      .option('interpreter', { type: 'boolean', default: false })
      .option('admin', { type: 'boolean', default: false }),
  (args) => devAuthCommand(args).catch(errorHandler)
)

yargs.command(
  'migrate',
  'Run any new database migrations',
  (yargs) => yargs,
  (args) => migrateCommand(args).catch(errorHandler)
)

// yargs.command(
//   'rebuild-audio <path> <file>',
//   'Rebuild audio in a given folder',
//   (yargs) =>
//     yargs
//       .positional('path', { type: 'string', demandOption: true })
//       .positional('file', { type: 'string', demandOption: true }),
//   handleFail(async (args) => {
//     await runRebuilder(args.path, args.file)
//   })
// )

// yargs.command(
//   'fake-schedule',
//   'Generate a fake schedule and put it into redis',
//   (yargs) => yargs,
//   handleFail(async (args) => {
//     await fakeSchedule()
//   })
// )

// yargs.command(
//   'geocode',
//   'Generate countries geocoded json',
//   (yargs) => yargs,
//   handleFail(async (args) => {
//     await runGeocode()
//   })
// )

// Execute the CLI
cli.parse()
