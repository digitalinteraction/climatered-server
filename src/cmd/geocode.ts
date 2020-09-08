import axios from 'axios'
import { validateEnv } from 'valid-env'
import countries = require('i18n-iso-countries')
import createDebug from 'debug'

const debug = createDebug('api:cmd:geocode')

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// https://maps.googleapis.com/maps/api/geocode/json?&address=algeria&key=AIzaSyDN3M2TenuRulsRnfnHdCTh_71GUefAsMw

export async function runGeocode() {
  validateEnv(['GEOCODE_KEY'])

  const { GEOCODE_KEY = '' } = process.env

  debug('key=%s', GEOCODE_KEY)

  const output: any[] = []
  for (const [code, name] of Object.entries(countries.getNames('en'))) {
    debug('code=%s name=%s', code, name)

    const address = Array.isArray(name) ? name[0] : name

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          key: GEOCODE_KEY,
          address,
        },
      }
    )

    const location = response.data.results[0]?.geometry?.location ?? null
    debug('found location=%o', location)

    await pause(200)

    output.push({
      code,
      name,
      location,
    })
  }

  console.log(JSON.stringify(output))
}
