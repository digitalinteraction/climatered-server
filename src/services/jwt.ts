import jwt = require('jsonwebtoken')

// From jwt.SignOptions, add more fields as they are needed
interface SignOptions {
  expiresIn: string | number
}

export interface LoginJwt {
  typ: 'login'
  sub: string
  user_roles: string[]
}

export interface AuthJwt {
  typ: 'auth'
  sub: string
  user_roles: string[]
  user_lang: string
}

/**
 * A service for signing and verifying json web tokens
 */
export interface JwtService {
  sign(payload: any, signOptions?: SignOptions): string
  verify(token: string): string | object
}

export function createJwtService(secretKey: string): JwtService {
  return {
    sign: (payload, options) => jwt.sign(payload, secretKey, options),
    verify: (token) => jwt.verify(token, secretKey),
  }
}
