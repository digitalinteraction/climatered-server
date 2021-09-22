import { MetricsSockets } from '@openlab/deconf-api-toolkit'
import { Socket } from 'socket.io'
import { any, boolean, object, string, Struct } from 'superstruct'
import {
  AppBroker,
  AppContext,
  createDebug,
  SocketErrorHandler,
} from '../lib/module.js'

const debug = createDebug('cr:deconf:metrics-broker')

type Context = AppContext

const eventStructs = new Map<string, Struct<any>>()
eventStructs.set(
  'session/ical',
  object({
    sessionId: string(),
  })
)
eventStructs.set(
  'attendance/attend',
  object({
    sessionId: string(),
  })
)
eventStructs.set(
  'attendance/unattend',
  object({
    sessionId: string(),
  })
)
eventStructs.set(
  'login/start',
  object({
    emailHash: string(),
  })
)
eventStructs.set('login/finish', object({}))
eventStructs.set('login/logout', object({}))
eventStructs.set(
  'register/start',
  object({
    country: string(),
  })
)
eventStructs.set(
  'login/unregister',
  object({
    confirmed: boolean(),
  })
)
eventStructs.set(
  'general/pageView',
  object({
    routeName: string(),
    params: any(),
  })
)
eventStructs.set(
  'session/link',
  object({
    sessionId: string(),
    action: string(),
    link: string(),
  })
)
eventStructs.set(
  'atrium/widget',
  object({
    widget: string(),
  })
)

export class MetricsBroker implements AppBroker {
  #sockets: MetricsSockets
  constructor(context: Context) {
    this.#sockets = new MetricsSockets({
      ...context,
      eventStructs,
      pause: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    })
  }

  async socketConnected(socket: Socket, handleErrors: SocketErrorHandler) {
    await this.#sockets.cameOnline(socket.id)

    socket.on(
      'trackMetric',
      handleErrors(async (eventName, payload) => {
        debug('trackMetric socket=%o event=%o', socket.id, eventName)
        await this.#sockets.event(socket.id, eventName, payload)
      })
    )

    socket.on(
      'trackError',
      handleErrors(async (error) => {
        debug('trackError socket=%o', socket.id)
        await this.#sockets.error(socket.id, error)
      })
    )
  }

  async socketDisconnected(socket: Socket) {
    await this.#sockets.wentOffline(socket.id)
  }
}
