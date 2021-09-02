import { MetricsSockets } from '@openlab/deconf-api-toolkit'
import { Socket } from 'socket.io'
import {
  AppBroker,
  AppContext,
  createDebug,
  SocketErrorHandler,
} from '../lib/module'

const debug = createDebug('cr:deconf:metrics-broker')

type Context = AppContext

export class MetricsBroker implements AppBroker {
  #sockets: MetricsSockets
  constructor(context: Context) {
    this.#sockets = new MetricsSockets(context)
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
