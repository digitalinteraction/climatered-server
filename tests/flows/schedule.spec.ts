import { createServer } from '../../src/test-utils'
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
  // [2] Test getting sessions without authentication
  //
  const unauthedSessions = await agent.get('/schedule/sessions')

  expect(unauthedSessions.status).toEqual(200)
  expect(unauthedSessions.body.sessions).toHaveLength(5)
  expect(unauthedSessions.body.sessions[0]).toEqual({
    slug: expect.any(String),
    id: expect.any(String),
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
    isRecorded: expect.any(Boolean),
    track: expect.any(String),
    themes: expect.any(Array),
    speakers: expect.any(Array),
    attendeeInteraction: expect.any(String),
    attendeeDevices: expect.any(String),
  })

  //
  // [3] Test getting sessions with authentication
  //
  const authedSessions = await agent
    .get('/schedule/sessions')
    .set({ authorization })

  expect(authedSessions.status).toEqual(200)
  expect(authedSessions.body.sessions).toHaveLength(5)
  expect(authedSessions.body.sessions[0].links).toContainEqual({
    type: expect.any(String),
    url: expect.any(String),
    language: expect.any(String),
  })

  //
  // [4] Test settings are returned
  //
  const sessions = await agent.get('/schedule/settings')
  expect(sessions.status).toEqual(200)
  expect(sessions.body.settings).toEqual({
    scheduleLive: false,
  })
})
