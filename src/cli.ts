#!/usr/bin/env node

//
// The cli entrypoint
//

import yargs, { string } from 'yargs'
import { hideBin } from 'yargs/helpers'

import { devAuthCommand } from './cmd/dev-auth-command'
import { fakeScheduleCommand } from './cmd/fake-schedule-command'
import { fetchContentCommand } from './cmd/fetch-content-command'
import { geocodeCommand } from './cmd/geocode-command'
import { hackCommand, allHackCommands } from './cmd/hack-command'
import { migrateCommand } from './cmd/migrate-command'
import {
  pretalxDataCommand,
  pretalxDataCommands,
} from './cmd/pretalx-data-command'
import { rebuildAudioCommand } from './cmd/rebuild-audio-command'
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

cli.command(
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

cli.command(
  'scrape-pretalx',
  'Scrape content from pretalx and put into redis',
  (yargs) => yargs,
  (args) => scrapePretalxCommand(args).catch(errorHandler)
)

cli.command(
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

cli.command(
  'dev-auth',
  'Generate an authentication for local Development',
  (yargs) =>
    yargs
      .option('email', { type: 'string', demandOption: true })
      .option('interpreter', { type: 'boolean', default: false })
      .option('admin', { type: 'boolean', default: false }),
  (args) => devAuthCommand(args).catch(errorHandler)
)

cli.command(
  'hack <hack>',
  'Run one of the hack commands',
  (yargs) =>
    yargs.positional('hack', {
      type: 'string',
      choices: Object.keys(allHackCommands),
      demandOption: true,
    }),
  (args) => hackCommand(args).catch(errorHandler)
)

cli.command(
  'migrate',
  'Run any new database migrations',
  (yargs) => yargs,
  (args) => migrateCommand(args).catch(errorHandler)
)

cli.command(
  'rebuild-audio <directory> <outfile>',
  'Rebuild pre-downloaded audio chunks in a given folder into a single wav file',
  (yargs) =>
    yargs
      .positional('directory', { type: 'string', demandOption: true })
      .positional('outfile', { type: 'string', demandOption: true }),
  async (args) => rebuildAudioCommand(args).catch(errorHandler)
)

cli.command(
  'fake-schedule',
  'Generate a fake schedule and put it into redis',
  (yargs) =>
    yargs.option('interpreter', { type: 'string', array: true, default: [] }),
  (args) => fakeScheduleCommand(args).catch(errorHandler)
)

cli.command(
  'geocode',
  'Generate and output geocoded locations',
  (yargs) => yargs,
  (args) => geocodeCommand(args).catch(errorHandler)
)

cli.command(
  'fetch-content',
  'Fetch content from climatered-schedule and put into redis',
  (yargs) =>
    yargs
      .positional('remote', {
        type: 'string',
        describe: 'The remote of the git repository',
        default: 'git@github.com:digitalinteraction/climatered-content.git',
      })
      .positional('branch', {
        type: 'string',
        describe: 'The branch to use',
        default: 'main',
      }),
  (args) => fetchContentCommand(args).catch(errorHandler)
)

// Execute the CLI
cli.parse()
