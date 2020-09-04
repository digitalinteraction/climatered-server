import createDebug = require('debug')
import { TypedChow } from '../server'
import { PoolClient } from '../services/postgres'

const debug = createDebug('api:event:log')

interface LogEvent {
  name: 'log'
  payload: {
    action: string
    data: any
    attendee?: number
    socket?: string
    client?: PoolClient
  }
}

export default function log(chow: TypedChow) {
  //
  // log an event to postgres
  //
  chow.event<LogEvent>('log', async ({ event, pg }) => {
    const {
      action,
      data = null,
      attendee = null,
      socket = null,
      client = undefined,
    } = event.payload

    await pg.run((client) => {
      return client.sql`
        INSERT INTO logs (action, attendee, socket, data)
        VALUES (${action}, ${attendee}, ${socket}, ${data})
      `
    }, client)
  })
}
