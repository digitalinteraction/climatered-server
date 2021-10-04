import {
  DeconfBaseContext,
  MetricsRepository as DeconfMetricsRepository,
} from '@openlab/deconf-api-toolkit'

export interface MetricsRecord {
  id: number
  created: Date
  attendee: number | null
  socket: string
  event: string
  data: unknown
}

export interface AttendeeCount {
  verified: boolean
  count: number
}

type Context = Pick<DeconfBaseContext, 'postgres'>

export class MetricsRepository extends DeconfMetricsRepository {
  get #postgres() {
    return this.#context.postgres
  }

  #context: Context
  constructor(context: Context) {
    super(context)
    this.#context = context
  }

  getEvents(): Promise<MetricsRecord[]> {
    return this.#postgres.run((client) => {
      return client.sql`
        SELECT id, created, attendee, socket, event, data
        FROM logs;
      `
    })
  }

  getAttendeeCounts(): Promise<AttendeeCount[]> {
    return this.#postgres.run(
      (client) =>
        client.sql`
        SELECT verified, count(DISTINCT email) as count
        FROM attendees
        GROUP BY verified;
      `
    )
  }
}
