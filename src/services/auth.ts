import { RedisService } from './redis'
import { AuthJwt, JwtService } from './jwt'
import { ChowRequest } from '@robb_j/chowchow/dist'

/**
 * A service for authenticating socket and route logic
 */
export interface AuthService {
  fromSocket(socketId: string): Promise<AuthJwt | null>
  fromRequest(request: ChowRequest): Promise<AuthJwt | null>
}

const bearerRegex = /^bearer /i

// Get an authentication from a socket's id given an redis service
async function fromSocket(socketId: string, redis: RedisService) {
  return redis
    .getJson<AuthJwt | null>(`auth_${socketId}`, null)
    .catch((err) => null)
}

// Get an authentication from a request's authorization header
async function fromRequest(request: ChowRequest, jwt: JwtService) {
  const { authorization = '' } = request.headers
  if (!bearerRegex.test(authorization)) return null

  const token = authorization.replace(bearerRegex, '')
  try {
    const login: AuthJwt = jwt.verify(token) as any

    // make sure it isn't just a string and is the correct type of token
    if (typeof login !== 'object' || login.typ !== 'auth') return null

    return login
  } catch (error) {
    return null
  }
}

export function createAuthService(
  redis: RedisService,
  jwt: JwtService
): AuthService {
  return {
    fromSocket: (id) => fromSocket(id, redis),
    fromRequest: (request) => fromRequest(request, jwt),
  }
}
