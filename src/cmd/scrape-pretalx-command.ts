import { createDebug } from '../lib/module.js'

const debug = createDebug('cr:cmd:scrape-pretalx')

export interface ScrapePretalxCommandOptions {}

export async function scrapePretalxCommand(
  options: ScrapePretalxCommandOptions
) {
  debug('start')
}
