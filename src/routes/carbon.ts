import { TypedChow } from '../server'
import dataset = require('../data/countries-latlng.json')
import distance = require('haversine-distance')

const carbonKey = 'c02'

// For an entire airplane, 0.85kg per kilometer
const CARBON_FACTOR = 0.85

interface Location {
  code: string
  name: string
  location: {
    lat: number
    lng: number
  }
}

interface CountryCount {
  country: string
  count: number
}

interface Packet {
  totalDistance: number
  carbonNotEmitted: number
}

export default function carbon(chow: TypedChow) {
  const map = new Map<string, Location>()

  for (const item of dataset) {
    map.set(item.code, item as Location)
  }

  //
  // GET /carbon
  //
  chow.route('get', '/carbon', async ({ redis, pg }) => {
    // const authToken = await auth.fromRequest(request)
    // if (!authToken) throw new BadAuth()

    const cached = await redis.getJson<Packet | null>(carbonKey, null)
    if (cached) return cached

    const result = await pg.run((client) => {
      return client.sql<CountryCount>`
        SELECT country, count(*) as count
        FROM attendees
        GROUP BY country
        ORDER BY count DESC;
      `
    })

    const origin = map.get('CH')!

    let totalDistance = 0 // in meters

    for (const item of result) {
      const center = map.get(item.country)
      if (!center) continue

      totalDistance += distance(origin.location, center.location) * item.count
    }

    // Outbound and return trips
    totalDistance *= 2

    // At 0.85 kg of CO2 per kilometer
    const carbonNotEmitted = (totalDistance * CARBON_FACTOR) / 1000

    const response = {
      totalDistance,
      carbonNotEmitted,
    }

    // Cache the response for 5 minutes
    await redis.setAndExpire(carbonKey, JSON.stringify(response), 5 * 60)
    return response
  })
}
