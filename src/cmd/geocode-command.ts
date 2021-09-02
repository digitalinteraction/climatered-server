import got from 'got'
import { validateEnv } from 'valid-env'
import countries from 'i18n-iso-countries'

import { createDebug } from '../lib/module'

const debug = createDebug('cr:cmd:geocode')

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface GeocodeCommandOptions {
  // ...
}

interface PartialResponse {
  results: Array<{
    geometry?: {
      location: {
        lat: number
        lng: number
      }
    }
  }>
}

export async function geocodeCommand(options: GeocodeCommandOptions) {
  const { GEOCODE_KEY } = process.env
  if (!GEOCODE_KEY) throw new Error('"GEOCODE_KEY" not set')

  debug('start key=%o', GEOCODE_KEY)

  const output: any[] = []
  for (const [code, name] of Object.entries(countries.getNames('en'))) {
    //
    // Use the google API to get a location for each country
    //
    const response = await got
      .get('https://maps.googleapis.com/maps/api/geocode/json', {
        searchParams: {
          key: GEOCODE_KEY,
          address: name,
        },
      })
      .json<PartialResponse>()

    const location = response.results[0]?.geometry?.location ?? null
    debug('address=%o lat=%o lng=%o', name, location?.lat, location?.lng)

    await pause(200)

    output.push({
      code,
      name,
      location,
    })
  }

  console.log(JSON.stringify(output, null, 2))
}
