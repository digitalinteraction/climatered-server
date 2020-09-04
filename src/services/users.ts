import { PostgresService, PoolClient } from './postgres'
import { Registration, RegisterBody, Attendance } from '../structs'

interface SessionAttendance {
  session: string
  count: number
}
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
  attend(attendee: number, session: string): Promise<void>
  unattend(attendee: number, session: string): Promise<void>
  getAttendance(): Promise<Map<string, number>>
  getUserAttendance(attendee: number): Promise<Attendance[]>
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

async function attend(client: PoolClient, attendee: number, session: string) {
  //
  // Check previous attendance
  //
  const result = await client.sql<Attendance>`
    SELECT FROM attendance
    WHERE attendee=${attendee} AND session=${session}
  `

  if (result.length > 0) return

  await client.sql`
    INSERT INTO attendance (attendee, session)
    VALUES (${attendee}, ${session})
  `
}

async function unattend(client: PoolClient, attendee: number, session: string) {
  await client.sql`
    DELETE FROM attendance
    WHERE attendee=${attendee} AND session=${session}
  `
}

async function getAttendance(client: PoolClient) {
  const records = await client.sql<SessionAttendance>`
    SELECT session, count(*) as count
    FROM attendance
    GROUP BY session;
  `
  const map = new Map<string, number>()

  for (const r of records) {
    map.set(r.session, r.count)
  }

  return map
}

async function getUserAttendance(client: PoolClient, attendee: number) {
  return await client.sql<Attendance>`
    SELECT id, created, attendee, session
    FROM attendance
    WHERE attendee=${attendee}
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
    attend: (a, s) => pg.run((c) => attend(c, a, s)),
    unattend: (a, s) => pg.run((c) => unattend(c, a, s)),
    getAttendance: () => pg.run((c) => getAttendance(c)),
    getUserAttendance: (a) => pg.run((c) => getUserAttendance(c, a)),
  }
}
