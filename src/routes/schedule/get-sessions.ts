import { TypedChow } from '../../server'
import { Speaker, Session } from '../../structs'

type SessionWithSpeakers = Session | { speakers: Speaker[] }

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
      let sessions = await schedule.getSessions()
      const speakers = await schedule.getSpeakers()

      //
      // Remove links from the sessions if they aren't logged in
      //
      if (!authToken) {
        sessions = sessions.map((e) => ({ ...e, links: [] }))
      }

      //
      // Add speakers to any sessions
      //
      const speakerMap = speakers.reduce((map, speaker) => {
        map.set(speaker.slug, speaker)
        return map
      }, new Map<string, Speaker>())
      for (const session of sessions) {
        ;(session as any).speakers = session.speakers.flatMap((slug) =>
          speakerMap.get(slug)
        )
      }

      //
      // Send back the sessions
      //
      return { sessions }
    }
  )
}
