import { TypedChow } from '../../server'

export default function getSlots(chow: TypedChow) {
  //
  // GET /schedule/events
  //
  chow.route('get', '/schedule/events', async ({ request, schedule, jwt }) => {
    //
    // Get the user's auth from the request
    //
    const auth = jwt.authFromRequest(request)

    //
    // Load events from the schedule
    //
    let events = await schedule.getEvents()

    //
    // Remove links from the events if they aren't logged in
    //
    if (!auth) {
      events = events.map((e) => ({ ...e, links: [] }))
    }

    //
    // Send back the events
    //
    return { events }
  })
}
