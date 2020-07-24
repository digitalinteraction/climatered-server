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

beforeEach(async () => {
  chow = createServer()
  getSessionsRoute(chow)

  mocked(chow.schedule.getSessions).mockResolvedValue(fakeSessions)
})

describe('GET /schedule/sessions', () => {
  it('should return the sessions in the schedule', async () => {
    const res = await chow.http('get', '/schedule/sessions')

    const sessionsWithoutLinks = fakeSessions.map((e) => ({ ...e, links: [] }))

    expect(res.sessions).toEqual(sessionsWithoutLinks)
  })

  it('should add links when authenticated', async () => {
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

    const res = await chow.http('get', '/schedule/sessions', { headers })

    expect(res.sessions).toEqual(fakeSessions)
  })
})
