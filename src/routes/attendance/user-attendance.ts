import { TypedChow, BadAuth, BadRequest } from '../../server'

import { object, string, length, validate } from 'superstruct'

const RequestParams = object({
  session: length(string(), 1, 100),
})

export default function userAttendance(chow: TypedChow) {
  //
  // GET /attend/:session
  //
  chow.route(
    'get',
    '/attendance/:session',
    async ({ users, auth, request, schedule }) => {
      const [, params] = validate(request.params, RequestParams)
      if (!params) return new BadRequest()

      const session = await schedule.findSession(params.session)
      if (!session) return new BadRequest()

      const userToken = await auth.fromRequest(request)
      if (!userToken) return new BadAuth()

      const attendee = await users.getRegistration(userToken.sub, true)
      if (!attendee) return new BadAuth()

      const attendance = await users.getUserAttendance(attendee.id)

      const sessionAttendance = attendance.find(
        (a) => a.session === params.session
      )

      return {
        isAttending: Boolean(sessionAttendance),
        attendance: sessionAttendance || null,
      }
    }
  )
}
