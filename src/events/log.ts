import createDebug = require('debug')
import { TypedChow } from '../server'
import { PoolClient } from '../services/postgres'

const debug = createDebug('api:event:log')

export interface LogEvent {
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
  debug('enabled=' + chow.env.ENABLE_EVENT_LOGS)
  //
  // log an event to postgres
  //
  chow.event<LogEvent>('log', async ({ event, pg }) => {
    if (chow.env.ENABLE_EVENT_LOGS === false) return

    const {
      action,
      data = null,
      attendee = null,
      socket = null,
      client = undefined,
    } = event.payload
    debug(`action=${action} socket=${socket}, attendee=${attendee}`)
    await pg.run((client) => {
      return client.sql`
        INSERT INTO logs (event, attendee, socket, data)
        VALUES (${action}, ${attendee}, ${socket}, ${data})
      `
    }, client)
  })
}
