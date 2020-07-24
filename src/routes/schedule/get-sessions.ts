import { TypedChow } from '../../server'

export default function getSessions(chow: TypedChow) {
  //
  // GET /schedule/sessions
  //
  chow.route(
    'get',
    '/schedule/sessions',
    async ({ request, schedule, jwt }) => {
      //
      // Get the user's auth from the request
      //
      const auth = jwt.authFromRequest(request)

      //
      // Load sessions from the schedule
      //
      let sessions = await schedule.getSessions()

      //
      // Remove links from the sessions if they aren't logged in
      //
      if (!auth) {
        sessions = sessions.map((e) => ({ ...e, links: [] }))
      }

      //
      // Send back the sessions
      //
      return { sessions }
    }
  )
}
