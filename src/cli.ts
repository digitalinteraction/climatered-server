#!/usr/bin/env node

//
// The cli entrypoint
//

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { devAuthCommand } from './cmd/dev-auth-command.js'
import { fakeScheduleCommand } from './cmd/fake-schedule-command.js'
import { fetchContentCommand } from './cmd/fetch-content-command.js'
import { geocodeCommand } from './cmd/geocode-command.js'
import { hackCommand, allHackCommands } from './cmd/hack-command.js'
import { logVisitorsCommand } from './cmd/log-visitors-command.js'
import { migrateCommand } from './cmd/migrate-command.js'
import { rebuildAudioCommand } from './cmd/rebuild-audio-command.js'
import {
  scrapePretalxCommand,
  pretalxDataCommands,
} from './cmd/scrape-pretalx-command.js'
import { serveCommand } from './cmd/serve-command.js'

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
  (args) => pretalxDataCommands[args.data]?.().catch(errorHandler)
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
      .positional('outfile', { type: 'string', demandOption: true })
      .option('sampleRate', { type: 'number', default: 16000 }),
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
      .option('remote', {
        type: 'string',
        describe: 'The remote of the git repository',
        default:
          process.env.CONTENT_GIT_REMOTE ??
          'git@github.com:digitalinteraction/climatered-content.git',
      })
      .option('branch', {
        type: 'string',
        describe: 'The branch to use',
        default: process.env.CONTENT_GIT_BRANCH ?? 'main',
      })
      .option('reuse', {
        type: 'string',
        describe: 'A previously checked out repo to re-use',
      }),
  (args) => fetchContentCommand(args).catch(errorHandler)
)

cli.command(
  'log-visitors',
  'Get the current number of site visitors and log it as a metric',
  (yargs) => yargs,
  (args) => logVisitorsCommand(args).catch(errorHandler)
)

// Execute the CLI
cli.parse()
