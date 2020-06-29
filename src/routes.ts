import path = require('path')
import express = require('express')
import { Server as SocketServer } from 'socket.io'
import createDebug = require('debug')
import cors = require('cors')
import morgan = require('morgan')
import jwt = require('jsonwebtoken')
import emailRegex = require('email-regex')
import sendgrid = require('@sendgrid/mail')

import { Env } from './env'
import { pkg } from './pkg'

import slots = require('./data/slots.json')
import events = require('./data/events.json')
import registrations = require('./data/registrations.json')

const debug = createDebug('api:routes')

const trackingSettings = {
  clickTracking: { enable: false },
  openTracking: { enable: false },
  subscriptionTracking: { enable: false },
  ganalytics: { enable: false },
}

function appendUrl(url: URL, extraPath: string) {
  return new URL(path.join(url.pathname, extraPath), url.origin)
}

export function checkAuthorization(jwtSecret: string, headers: any) {
  const auth = headers.authorization

  if (!auth || !auth.startsWith('Bearer ')) return false
  const token = auth.slice(7)

  try {
    const payload = jwt.verify(token, jwtSecret) as any

    if (typeof payload !== 'object') return false
    if (payload.typ !== 'auth') return false

    return true
  } catch (error) {
    return false
  }
}

interface AuthJwt {
  typ: 'auth'
  sub: string
}

export function getJwt(authorization: string) {
  return jwt.decode(authorization) as AuthJwt
}

export function createRoutes(io: SocketServer, env: Env) {
  const app = express.Router()

  const selfUrl = new URL(env.SELF_URL)

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  if (env.CORS_HOSTS.length > 0) {
    debug(`cors=${env.CORS_HOSTS}`)
    app.use(cors({ origin: env.CORS_HOSTS }))
  } else {
    debug('no cors')
  }

  if (process.env.ENABLE_ACCESS_LOGS === 'true') {
    debug('access logs on')
    app.use(morgan('tiny'))
  } else {
    debug('access logs off')
  }

  const auth: express.RequestHandler = (req, res, next) => {
    const hasAuth = checkAuthorization(env.JWT_SECRET, req.headers)
    debug(`hasAuth=${hasAuth}`)

    if (hasAuth) return next()
    else res.status(401).send({ message: 'Not authorized' })
  }

  app.get('/', (req, res) => {
    res.send({
      message: 'ok',
      pkg: {
        name: pkg.name,
        version: pkg.version,
      },
    })
  })

  app.get('/slots', auth, (req, res) => {
    res.send({ slots })
  })

  app.get('/events', auth, (req, res) => {
    res.send({ events })
  })

  app.get('/slots/:slot', auth, (req, res) => {
    const slot = slots.find((s) => s.id === req.params.slot)

    if (!slot) {
      res.status(404).send({ message: 'Not found' })
    } else {
      res.send({
        slot,
        events: events.filter((e) => e.slot === slot.id),
      })
    }
  })

  app.get('/login/email', async (req, res, next) => {
    const email = (req.query.email ?? '') as string

    const isValid = typeof email == 'string' && emailRegex().test(email)
    if (!isValid) return res.status(400).send({ message: 'Bad email' })

    const isRegistered = registrations.some(
      (r) => r.email.toLowerCase() === email.toLowerCase()
    )
    if (!isRegistered) return res.status(400).send({ message: 'Bad email' })

    const link = appendUrl(selfUrl, '/login/email/callback')
    link.searchParams.set(
      'token',
      jwt.sign({ typ: 'login', sub: email }, env.JWT_SECRET, {
        expiresIn: '30m',
      })
    )

    const text = ['Hi,\n', 'Here is your login link: ' + link.toString()]

    await sendgrid.send({
      to: email as string,
      subject: 'Login email',
      from: env.SENDGRID_FROM,
      text: text.join('\n'),
      trackingSettings,
    })

    return res.send({ message: 'ok' })
  })

  app.get('/login/email/callback', async (req, res, next) => {
    try {
      const raw = req.query.token
      if (typeof raw !== 'string') throw new Error('Bad token')
      let token = jwt.verify(raw, env.JWT_SECRET) as any

      if (typeof token !== 'object') throw new Error('Bad token')
      if (token.typ !== 'login') throw new Error('Bad token')

      const auth = jwt.sign({ typ: 'auth', sub: token.sub }, env.JWT_SECRET)

      const url = new URL('/_token', env.WEB_URL)
      url.searchParams.set('token', auth)

      res.redirect(url.toString())
    } catch (error) {
      const url = new URL('/error', env.WEB_URL)
      url.searchParams.set('message', error.message)

      res.redirect(url.toString())
    }
  })

  return app
}
