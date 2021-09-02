import {
  createMemoryStore,
  JwtService,
  PostgresService,
  RegistrationRepository,
} from '@openlab/deconf-api-toolkit'
import { AuthToken } from '@openlab/deconf-shared'
import { createEnv, UrlService, createDebug } from '../lib/module'
import jsonwebtoken from 'jsonwebtoken'

const debug = createDebug('cr:cmd:dev-auth')

export interface DevAuthCommandOptions {
  email: string
  interpreter: boolean
  admin: boolean
}

//
// A command to generate a authentication for a given conference attendee
// - The email must already by a verified attendee
// - Optionally make them a interpreter or admin
// - Outputs the JWT and a URL to login with
//
export async function devAuthCommand(options: DevAuthCommandOptions) {
  debug('start')

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
  debug(
    'registrations %o',
    registrations.map((r) => r.id)
  )
  const verifiedUser = registrations.find((r) => r.verified)

  if (!verifiedUser) {
    throw new Error(`Registration not found for "${options.email}"`)
  }

  // Generate roles
  const roles = ['attendee']
  if (options.interpreter) roles.push('interpreter')
  if (options.admin) roles.push('admin')
  debug('roles %o', roles)

  // Sign a JWT
  const token = auth.signToken<AuthToken>({
    kind: 'auth',
    sub: verifiedUser.id,
    user_lang: verifiedUser.language,
    user_roles: roles,
  })
  debug('token %O', jsonwebtoken.decode(token))

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

  // Clost out postgres connection
  await postgres.close()
}
