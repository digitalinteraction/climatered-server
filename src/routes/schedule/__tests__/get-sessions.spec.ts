import {
  TypedMockChow,
  createServer,
  createSession,
  mocked,
} from '../../../test-utils'
import getSessionsRoute from '../get-sessions'
import jwt = require('jsonwebtoken')

let chow: TypedMockChow

let fakeSessions = [
  createSession('001', 'plenary', '001', true),
  createSession('002', 'panel', '002', true),
  createSession('003', 'session', '003', false),
]

// Only create 2 so the third is assigned to test that too
const fakeAttendance = new Map([
  ['001', 5],
  ['002', 3],
])

beforeEach(async () => {
  chow = createServer()
  getSessionsRoute(chow)

  mocked(chow.schedule.getSessions).mockResolvedValue(fakeSessions)
  mocked(chow.users.getAttendance).mockResolvedValue(fakeAttendance)
})

function authSetup() {
  let authToken = jwt.sign(
    {
      typ: 'auth',
      sub: 'user@example.com',
      user_roles: ['attendee'],
      user_lang: 'en',
    },
    chow.env.JWT_SECRET
  )

  const headers = {
    authorization: `Bearer ${authToken}`,
  }

  return { authToken, headers }
}

describe('GET /schedule/sessions', () => {
  it('should return the sessions in the schedule', async () => {
    const res = await chow.http('get', '/schedule/sessions')

    const unauthedSessions = fakeSessions.map((e) => ({
      ...e,
      links: [],
      hostEmail: null,
    }))

    expect(res.sessions).toHaveLength(3)

    expect(res.sessions[0]).toEqual({ ...unauthedSessions[0], attendance: 5 })
    expect(res.sessions[1]).toEqual({ ...unauthedSessions[1], attendance: 3 })
    expect(res.sessions[2]).toEqual({ ...unauthedSessions[2], attendance: 0 })
  })

  it('should return full sessions when authenticated', async () => {
    const { headers } = authSetup()

    const res = await chow.http('get', '/schedule/sessions', { headers })

    expect(res.sessions).toEqual(fakeSessions)
  })

  it('should add links when authenticated', async () => {
    const { headers } = authSetup()

    const res = await chow.http('get', '/schedule/sessions', { headers })

    expect(res.sessions[0].links[0]).toEqual({
      url: expect.any(String),
      type: expect.any(String),
      language: expect.any(String),
    })
  })

  it('should not return draft sessions', async () => {
    const session = createSession('001', 'plenary', '001', true)
    session.isDraft = true

    mocked(chow.schedule.getSessions).mockResolvedValue([session])

    const res = await chow.http('get', '/schedule/sessions')

    expect(res.sessions).toHaveLength(0)
  })

  it('should add the host email when authenticated', async () => {
    const { headers } = authSetup()

    const res = await chow.http('get', '/schedule/sessions', { headers })

    expect(res.sessions[0].hostEmail).toEqual(expect.any(String))
  })

  it('should allow links for public sessions', async () => {
    fakeSessions[0].isPublic = true

    const res = await chow.http('get', '/schedule/sessions')

    expect(res.sessions[0].links).toHaveLength(1)
  })
})
