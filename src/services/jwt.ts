import jwt = require('jsonwebtoken')
import { ChowRequest } from '@robb_j/chowchow'

// From jwt.SignOptions, add more fields as they are needed
interface SignOptions {
  expiresIn: string | number
}

export interface LoginJwt {
  typ: 'login'
  sub: string
}

export interface AuthJwt {
  typ: 'auth'
  sub: string
  user_roles: string[]
  user_lang: string
}

export interface JwtService {
  sign(payload: any, signOptions?: SignOptions): string
  verify(token: string): string | object
  authFromRequest(request: ChowRequest): AuthJwt | null
}

function authFromRequest(request: ChowRequest, secretKey: string) {
  const { authorization = '' } = request.headers
  if (!authorization.startsWith('Bearer ')) return null

  const token = authorization.replace('Bearer ', '')
  try {
    const login = jwt.verify(token, secretKey) as any

    if (typeof login !== 'object' || login.typ !== 'auth') {
      throw new Error('Bad jwt')
    }

    return login as AuthJwt
  } catch (error) {
    return null
  }
}

export function createJwtService(secretKey: string): JwtService {
  return {
    sign: (payload, options) => jwt.sign(payload, secretKey, options),
    verify: (token) => jwt.verify(token, secretKey),
    authFromRequest: (request) => authFromRequest(request, secretKey),
  }
}
