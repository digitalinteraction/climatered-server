import { TypedChow } from '../../server'
import { Session } from '../../structs'

export default function getSessions(chow: TypedChow) {
  //
  // GET /schedule/sessions
  //
  chow.route(
    'get',
    '/schedule/sessions',
    async ({ request, schedule, auth }) => {
      //
      // Get the user's auth from the request
      //
      const authToken = await auth.fromRequest(request)

      //
      // Load sessions from the schedule
      //
      let sessions: any[] = await schedule.getSessions()
      sessions = sessions.filter((s) => !s.isDraft)

      //
      // Remove links from the sessions if they aren't logged in
      //
      if (!authToken) {
        sessions = sessions.map((s) => ({
          ...s,
          links: [],
          hostEmail: null,
        }))
      }

      //
      // Send back the sessions
      //
      return { sessions }
    }
  )
}
