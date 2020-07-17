import { createServer, mocked } from '../../src/test-utils'
import { setupRoutes } from '../../src/server'
import supertest = require('supertest')
import jwt = require('jsonwebtoken')

test('Schedule flow', async () => {
  const chow = createServer()
  const { JWT_SECRET } = chow.env

  setupRoutes(chow)
  const agent = supertest(chow.app)

  const auth = {
    typ: 'auth',
    sub: 'user@example.com',
    user_roles: ['attendee'],
    user_lang: 'en',
  }
  const authorization = `Bearer ${jwt.sign(auth, JWT_SECRET)}`

  //
  // [1] Test getting slots
  //
  const slots = await agent.get('/schedule/slots')

  expect(slots.status).toEqual(200)
  expect(slots.body.slots).toHaveLength(3)
  expect(slots.body.slots[0]).toEqual({
    id: expect.any(String),
    start: expect.any(String),
    end: expect.any(String),
  })

  //
  // [2] Test getting events without authentication
  //
  const unauthedEvents = await agent.get('/schedule/events')

  expect(unauthedEvents.status).toEqual(200)
  expect(unauthedEvents.body.events).toHaveLength(5)
  expect(unauthedEvents.body.events[0]).toEqual({
    id: expect.any(String),
    name: expect.any(String),
    type: expect.any(String),
    slot: expect.any(String),
    title: {
      en: expect.any(String),
      fr: expect.any(String),
      es: expect.any(String),
      ar: expect.any(String),
    },
    content: {
      en: expect.any(String),
      fr: expect.any(String),
      es: expect.any(String),
      ar: expect.any(String),
    },
    links: [],
    hostLanguage: expect.any(String),
    enableTranslation: expect.any(Boolean),
  })

  //
  // [3] Test getting events with authentication
  //
  const authedEvents = await agent
    .get('/schedule/events')
    .set({ authorization })

  expect(authedEvents.status).toEqual(200)
  expect(authedEvents.body.events).toHaveLength(5)
  expect(authedEvents.body.events[0].links).toContainEqual({
    type: expect.any(String),
    url: expect.any(String),
    language: expect.any(String),
  })
})
