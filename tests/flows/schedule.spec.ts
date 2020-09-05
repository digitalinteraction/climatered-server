import { createServer } from '../../src/test-utils'
import { setupRoutes } from '../../src/server'
import supertest = require('supertest')
import jwt = require('jsonwebtoken')
import { Struct, assertStruct, SessionStruct } from '../../src/structs'

// function asserter<T = any>(value: any, struct: Struct<T>) {
//   return () => assertStruct(value, struct)
// }

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
    slug: expect.any(String),
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

  for (const s of unauthedSessions.body.sessions) {
    expect(s.links).toHaveLength(0)
  }

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
  const settings = await agent.get('/schedule/settings')
  expect(settings.status).toEqual(200)
  expect(settings.body.settings).toEqual({
    scheduleLive: false,
    enableHelpdesk: false,
    enableCoffeechat: false,
  })

  //
  // [5] Test speakers
  //
  const speakers = await agent.get('/schedule/speakers')

  expect(speakers.status).toEqual(200)
  expect(speakers.body.speakers).toHaveLength(3)

  //
  // [6] Test themes
  //
  const themes = await agent.get('/schedule/themes')

  expect(themes.status).toEqual(200)
  expect(themes.body.themes).toHaveLength(3)

  //
  // [7] Test tracks
  //
  const tracks = await agent.get('/schedule/tracks')

  expect(tracks.status).toEqual(200)
  expect(tracks.body.tracks).toHaveLength(3)

  //
  // [8] Test types
  //
  const types = await agent.get('/schedule/types')

  expect(types.status).toEqual(200)
  expect(types.body.types).toHaveLength(3)
})
