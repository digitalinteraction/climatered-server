import route from '../user-attendance'
import {
  createServer,
  createAuthToken,
  mocked,
  createRegistration,
  createAttendance,
} from '../../../test-utils'

//
// Experimental format like ./attend.spec.ts
//

function setup() {
  const chow = createServer()
  const attendee = createAuthToken(['attendee'])
  const reg = createRegistration()
  const attendance = createAttendance(1, '001')
  route(chow)

  mocked(chow.auth.fromRequest).mockResolvedValue(attendee)
  mocked(chow.users.getRegistration).mockResolvedValue(reg)
  mocked(chow.users.getUserAttendance).mockResolvedValue([
    {
      id: 1,
      created: new Date(),
      session: '001',
      attendee: 1,
    },
  ])

  return { chow, attendee, reg, attendance }
}

describe('GET /attendance/:session', () => {
  it('should return an boolean and null if not attending', async () => {
    const { chow } = setup()

    const res = await chow.http('get', '/attendance/002')

    expect(res).toEqual({
      attendance: null,
      isAttending: false,
    })
  })

  it('should return the attendance object and true if attending', async () => {
    const { chow, attendance } = setup()

    const res = await chow.http('get', '/attendance/001')

    expect(res).toEqual({
      isAttending: true,
      attendance: {
        ...attendance,
        created: expect.any(Date),
      },
    })
  })
})
