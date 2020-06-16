import { Server } from 'http'
import { validateEnv } from 'valid-env'
import express = require('express')
import cors = require('cors')
import morgan = require('morgan')
import jwt = require('jsonwebtoken')
import emailRegex = require('email-regex')
import createDebug = require('debug')

import sendgrid = require('@sendgrid/mail')

import slots = require('./data/slots.json')
import events = require('./data/events.json')
import registrations = require('./data/registrations.json')

const debug = createDebug('api:server')

const trackingSettings = {
  clickTracking: { enable: false },
  openTracking: { enable: false },
  subscriptionTracking: { enable: false },
  ganalytics: { enable: false },
}

// const r = (block: (...args: Parameters<express.RequestHandler>) => Promise<any>) => {
//   return async ([req, res, next]: Parameters<express.RequestHandler>) => {
//     try {
//       res.send(await block(req, res, next))
//     } catch (error) {
//       res.status(400)
//     }
//   }
// }

// async function wrap(res: express.Response, block: any) {
//   try {
//     res.send(await block())
//   } catch (error) {
//     res.status(400).send({ message: error.message, stack: error.stack })
//   }
// }

function shutdown(server: Server) {
  console.log('Shutting down ...')

  server.close((err) => {
    if (err) {
      console.error(err)
      process.exitCode = 1
    }
    process.exit()
  })
}

export function runServer() {
  const pkg = require('../package.json')
  const app = express()

  debug(`#runServer pkg=${pkg.name}, version=${pkg.version}`)

  validateEnv([
    'SENDGRID_API_KEY',
    'SENDGRID_FROM',
    'JWT_SECRET',
    'SELF_URL',
    'WEB_URL',
  ])

  debug('environment ok')

  const {
    SENDGRID_API_KEY,
    SENDGRID_FROM,
    JWT_SECRET,
    SELF_URL,
    WEB_URL,
  } = process.env as Record<string, string>

  sendgrid.setApiKey(SENDGRID_API_KEY)

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  if (process.env.CORS_HOSTS) {
    debug(`cors=${process.env.CORS_HOSTS}`)
    app.use(cors({ origin: process.env.CORS_HOSTS.split(',') }))
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
    const fail = (msg: string) => {
      debug('auth failed')
      res.status(401).send({ msg })
    }

    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) return fail('Not authorized')
    const token = auth.slice(7)

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any

      if (typeof payload !== 'object') return fail('Not authorized')
      if (payload.typ !== 'auth') return fail('Not authorized')

      debug('auth passed')
      return next()
    } catch (error) {
      return fail(error.message)
    }
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

    const link = new URL('/login/email/callback', SELF_URL)
    link.searchParams.set(
      'token',
      jwt.sign({ typ: 'login', sub: email }, JWT_SECRET, { expiresIn: '30m' })
    )

    const text = ['Hi,\n', 'Here is your login link: ' + link.toString()]

    await sendgrid.send({
      to: email as string,
      subject: 'Login email',
      from: SENDGRID_FROM,
      text: text.join('\n'),
      trackingSettings,
    })

    return res.send({ message: 'ok' })
  })

  app.get('/login/email/callback', async (req, res, next) => {
    try {
      const raw = req.query.token
      if (typeof raw !== 'string') throw new Error('Bad token')
      let token = jwt.verify(raw, JWT_SECRET) as any

      if (typeof token !== 'object') throw new Error('Bad token')
      if (token.typ !== 'login') throw new Error('Bad token')

      const auth = jwt.sign({ typ: 'auth', sub: token.sub }, JWT_SECRET)

      const url = new URL('/_token', WEB_URL)
      url.searchParams.set('token', auth)

      res.redirect(url.toString())
    } catch (error) {
      const url = new URL('/error', WEB_URL)
      url.searchParams.set('message', error.message)

      res.redirect(url.toString())
    }
  })

  return new Promise((resolve) => {
    const server = app.listen(3000, () => {
      console.log('Listening on :3000')

      resolve()
    })

    process.on('SIGINT', () => shutdown(server))
    process.on('SIGTERM', () => shutdown(server))
  })
}
