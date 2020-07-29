import { PostgresService, PoolClient } from './postgres'
import { Registration, RegisterBody } from '../structs'

/**
 * A service for retrieving registered users
 */
export interface UsersService {
  getRegistration(email: string): Promise<Registration | null>
  register(registration: RegisterBody): Promise<void>
  verify(email: string): Promise<void>
  compareEmails(a: string, b: string): boolean
}

export function compareEmails(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

async function getRegistration(client: PoolClient, email: string) {
  const matches = await client.sql<Registration>`
    SELECT id, created, name, email, language, country, affiliation, verified, consented
    FROM attendees
    WHERE email = ${email.toLowerCase()}
  `

  return matches[0] ?? null
}

async function addRegistration(client: PoolClient, r: RegisterBody) {
  const { name, email, language, country, affiliation } = r
  await client.sql`
    INSERT INTO attendees (name, email, language, country, affiliation)
    VALUES (${name}, ${email.toLowerCase()}, ${language}, ${country}, ${affiliation})
  `
}

async function verifyRegistration(client: PoolClient, email: string) {
  await client.sql`
    UPDATE attendees
    SET verified = ${true}
    WHERE email = ${email.toLowerCase()}
  `
}

export function createUsersService(pg: PostgresService): UsersService {
  return {
    getRegistration: (email) => pg.run((c) => getRegistration(c, email)),
    register: (r) => pg.run((c) => addRegistration(c, r)),
    verify: (e) => pg.run((c) => verifyRegistration(c, e)),
    compareEmails,
  }
}
