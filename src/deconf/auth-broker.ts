import { AuthSockets } from '@openlab/deconf-api-toolkit'
import { Socket } from 'socket.io'
import { AppBroker, AppContext, SocketErrorHandler } from '../lib/module'

type Context = AppContext

export class AuthBroker implements AppBroker {
  #sockets: AuthSockets
  constructor(context: Context) {
    this.#sockets = new AuthSockets(context)
  }

  async socketConnected(socket: Socket, handleErrors: SocketErrorHandler) {
    socket.on(
      'auth',
      handleErrors(async (authToken) => {
        await this.#sockets.auth(socket.id, authToken)
      })
    )

    socket.on(
      'deauth',
      handleErrors(async () => {
        await this.#sockets.deauth(socket.id)
      })
    )
  }

  async socketDisconnected(socket: Socket) {
    await this.#sockets.deauth(socket.id)
  }
}
