import { MetricsSockets } from '@openlab/deconf-api-toolkit'
import { Socket } from 'socket.io'
import { object, string, Struct } from 'superstruct'
import {
  AppBroker,
  AppContext,
  createDebug,
  SocketErrorHandler,
} from '../lib/module'

const debug = createDebug('cr:deconf:metrics-broker')

type Context = AppContext

const eventStructs = new Map<string, Struct<any>>()
eventStructs.set(
  'page-view',
  object({
    path: string(),
  })
)

// TODO: add more metrics

export class MetricsBroker implements AppBroker {
  #sockets: MetricsSockets
  constructor(context: Context) {
    this.#sockets = new MetricsSockets({
      ...context,
      eventStructs,
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
