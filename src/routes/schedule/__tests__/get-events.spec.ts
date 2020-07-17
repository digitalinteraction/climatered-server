import {
  TypedMockChow,
  createServer,
  createEvent,
  mocked,
} from '../../../test-utils'
import getEventsRoute from '../get-events'
import jwt = require('jsonwebtoken')

let chow: TypedMockChow

let fakeEvents = [
  createEvent('001', 'plenary', '001', true),
  createEvent('002', 'panel', '002', true),
  createEvent('003', 'session', '003', false),
]

beforeEach(() => {
  chow = createServer()
  getEventsRoute(chow)

  mocked(chow.schedule.getEvents).mockResolvedValue(fakeEvents)
})

describe('GET /schedule/events', () => {
  it('should return the events in the schedule', async () => {
    const res = await chow.http('get', '/schedule/events')

    const eventsWithoutLinks = fakeEvents.map((e) => ({ ...e, links: [] }))

    expect(res.events).toEqual(eventsWithoutLinks)
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

    const res = await chow.http('get', '/schedule/events', { headers })

    expect(res.events).toEqual(fakeEvents)
  })
})
