import {
  createMemoryStore,
  JwtService,
  PostgresService,
  RegistrationRepository,
} from '@openlab/deconf-api-toolkit'
import { AuthToken } from '@openlab/deconf-shared'
import { createEnv, UrlService } from '../lib/module'

export interface DevAuthCommandOptions {
  email: string
  interpreter: boolean
  admin: boolean
}

export async function devAuthCommand(options: DevAuthCommandOptions) {
  // Setup services
  const env = createEnv()
  const store = createMemoryStore()
  const postgres = new PostgresService({ env })
  const auth = new JwtService({ env, store })
  const urls = new UrlService({ env })

  // Create a registration repo to grab the user
  const reg = new RegistrationRepository({ postgres })

  // Grab the user
  const registrations = await reg.getRegistrations(options.email)
  const verifiedUser = registrations.find((r) => r.verified)

  if (!verifiedUser) {
    throw new Error(`Registration not found for "${options.email}"`)
  }

  // Generate roles
  const roles = ['attendee']
  if (options.interpreter) roles.push('interpreter')
  if (options.admin) roles.push('admin')

  // Sign a JWT
  const token = auth.signToken<AuthToken>({
    kind: 'auth',
    sub: verifiedUser.id,
    user_lang: verifiedUser.language,
    user_roles: roles,
  })

  // Generate a login URL
  const loginUrl = new URL('_token', env.CLIENT_URL)
  const params = new URLSearchParams()
  params.set('token', token)
  loginUrl.hash = params.toString()

  // Output info
  console.log('Generated AuthToken for email=%o', options.email)
  console.log(token)
  console.log()
  console.log('Login with:')
  console.log(urls.getClientLoginLink(token).toString())

  await postgres.close()
}
