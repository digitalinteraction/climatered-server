import { PostgresService, PoolClient } from './postgres'
import { Registration, RegisterBody } from '../structs'

/**
 * A service for retrieving registered users
 */
export interface UsersService {
  getRegistration(
    email: string,
    checkVerification: boolean
  ): Promise<Registration | null>
  register(registration: RegisterBody): Promise<void>
  verify(id: number): Promise<void>
  compareEmails(a: string, b: string): boolean
}

export function compareEmails(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

async function getRegistration(
  client: PoolClient,
  email: string,
  checkVerification: boolean
) {
  // get all registrations for that email, newest first
  const matches = await client.sql<Registration>`
    SELECT id, created, name, email, language, country, affiliation, verified, consented
    FROM attendees
    WHERE email = ${email.toLowerCase()}
    ORDER BY created DESC
  `

  // If told to check the verification, return the newest which is verified
  // if not, return the newest unverified one
  return checkVerification
    ? matches.find((r) => r.verified) ?? null
    : matches[0] ?? null
}

async function addRegistration(client: PoolClient, r: RegisterBody) {
  const { name, email, language, country, affiliation } = r

  await client.sql`
    INSERT INTO attendees (name, email, language, country, affiliation)
    VALUES (${name}, ${email.toLowerCase()}, ${language}, ${country}, ${affiliation})
  `
}

async function verifyRegistration(client: PoolClient, id: number) {
  await client.sql`
    UPDATE attendees
    SET verified = ${true}
    WHERE id = ${id}
  `
}

export function createUsersService(pg: PostgresService): UsersService {
  return {
    getRegistration: (email, checkVerification) => {
      return pg.run((c) => getRegistration(c, email, checkVerification))
    },
    register: (r) => pg.run((c) => addRegistration(c, r)),
    verify: (id) => pg.run((c) => verifyRegistration(c, id)),
    compareEmails,
  }
}
