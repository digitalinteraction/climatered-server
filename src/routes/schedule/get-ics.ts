import { TypedChow } from '../../server'
import { HttpResponse, HttpMessage } from '@robb_j/chowchow'
import ics = require('ics')
import createDebug = require('debug')

const debug = createDebug('api:route:get-ics')
const notFound = new HttpMessage(404, 'Not found')

type DateArr = [number, number, number, number, number]

function formatDate(startDate: Date): DateArr {
  return [
    startDate.getUTCFullYear(),
    startDate.getUTCMonth() + 1,
    startDate.getUTCDate(),
    startDate.getUTCHours(),
    startDate.getUTCMinutes(),
  ]
}

export default function getIcs(chow: TypedChow) {
  //
  // GET /schedule/ics/:slug
  //
  chow.route(
    'get',
    '/schedule/ics/:slug',
    async ({ request, schedule, url, env, auth }) => {
      const authToken = await auth.fromRequest(request)
      const locale: any = authToken?.user_lang ?? 'en'

      const localise = (obj: any) => obj[locale] as string

      const session = await schedule.findSession(request.params.slug!)
      if (!session) return notFound

      const allSlots = await schedule.getSlots()
      const slot = allSlots.find((s) => s.slug === session.slot)

      if (!slot) return notFound

      const startDate = new Date(slot.start)
      const endDate = new Date(slot.end)

      const webUrl = url.forWeb(`/session/${session.slug}`)

      const icsFile = ics.createEvent({
        start: formatDate(startDate),
        startInputType: 'utc',
        end: formatDate(endDate),
        endInputType: 'utc',
        title: localise(session.title),
        description: localise(session.content),
        location: webUrl.toString(),
        organizer: { name: 'Climate:Red', email: env.SENDGRID_FROM },
      })

      if (!icsFile.value) return new HttpMessage(400, 'Something went wrong')

      return new HttpResponse(200, icsFile.value, {
        'content-type': 'text/calendar',
        'content-disposition': `attachment; filename="${session.slug}.ics"`,
      })
    }
  )
}
