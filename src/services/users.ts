import registrations = require('../data/registrations.json')
import { RedisService } from './redis'

export interface Registration {
  name: string
  email: string
  language: string
  roles: string[]
}

export interface UsersService {
  getRegistration(email: string): Promise<Registration | null>
  registrationForSocket(
    id: string,
    redis: RedisService
  ): Promise<Registration | null>
}

function compareEmails(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

export function createUsersService(): UsersService {
  return {
    async getRegistration(email) {
      return registrations.find((r) => compareEmails(r.email, email)) ?? null
    },
    async registrationForSocket(id, redis) {
      try {
        const token = await redis.get('auth_' + id)
        if (!token) return null

        const { sub } = JSON.parse(token)

        return registrations.find((r) => compareEmails(r.email, sub)) ?? null
      } catch (error) {
        return null
      }
    },
  }
}
