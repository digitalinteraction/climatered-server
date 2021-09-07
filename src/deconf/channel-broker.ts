import { ChannelSockets } from '@openlab/deconf-api-toolkit'
import { Socket } from 'socket.io'
import { AppBroker, AppContext, SocketErrorHandler } from '../lib/module.js'

type Context = AppContext

export class ChannelBroker implements AppBroker {
  #sockets: ChannelSockets
  constructor(context: Context) {
    this.#sockets = new ChannelSockets(context)
  }

  async socketConnected(socket: Socket, handleErrors: SocketErrorHandler) {
    socket.on(
      'joinChannel',
      handleErrors(async (booth) => {
        await this.#sockets.joinChannel(socket.id, booth)
      })
    )

    socket.on(
      'leaveChannel',
      handleErrors(async (booth) => {
        await this.#sockets.leaveChannel(socket.id, booth)
      })
    )
  }

  async socketDisconnected(socket: Socket) {
    // ...
  }
}
