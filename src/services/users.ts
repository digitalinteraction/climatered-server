import registrations = require('../data/registrations.json')

export interface Registration {
  name: string
  email: string
  language: string
}

/**
 * A service for retrieving registered users
 */
export interface UsersService {
  getRegistration(email: string): Promise<Registration | null>
  compareEmails(a: string, b: string): boolean
}

export function compareEmails(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

async function getRegistration(email: string) {
  return registrations.find((r) => compareEmails(r.email, email)) ?? null
}

export function createUsersService(): UsersService {
  return {
    getRegistration: (email) => getRegistration(email),
    compareEmails,
  }
}
