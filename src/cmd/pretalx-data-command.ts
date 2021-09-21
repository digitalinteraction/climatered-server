import { createDebug } from '../lib/module.js'

const debug = createDebug('cr:cmd:pretalx-data')

export const pretalxDataCommands = {}

export interface PretalxDataCommandOptions {
  /** The data command to run */
  data: string
}

export async function pretalxDataCommand(options: PretalxDataCommandOptions) {
  debug('data %o', options.data)
}
