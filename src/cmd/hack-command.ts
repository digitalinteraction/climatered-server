import {
  CountryLocationStruct,
  loadResources,
  RESOURCE_CARBON_LOCATIONS,
} from '@openlab/deconf-api-toolkit'
import { array, assert as assertStruct } from 'superstruct'
import { createDebug } from '../lib/module.js'

const debug = createDebug('cr:cmd:hack')

const hacks: Record<string, () => Promise<void>> = {}
export const allHackCommands = hacks

export interface HackCommandOptions {
  hack: string
}

export async function hackCommand(options: HackCommandOptions) {
  debug('hack %o', options.hack)

  const command = hacks[options.hack]

  if (!command) {
    console.error('Available commands %o', Object.keys(hacks))
    throw new Error(`Hack not found '${options.hack}'`)
  }

  await command()
}

//
// Hacks
//

hacks['lint-countries'] = async () => {
  const resources = await loadResources('res')
  const buffer = resources.get(RESOURCE_CARBON_LOCATIONS)
  if (!buffer) {
    throw new Error(`Not found "${RESOURCE_CARBON_LOCATIONS}"`)
  }
  const countries = JSON.parse(buffer.toString('utf8'))

  assertStruct(countries, array(CountryLocationStruct))
}
