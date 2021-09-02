import { InterpreterSockets } from '@openlab/deconf-api-toolkit'
import { Socket } from 'socket.io'
import { AppBroker, AppContext, SocketErrorHandler } from '../lib/module'

type Context = AppContext

export class InterpreterBroker implements AppBroker {
  #sockets: InterpreterSockets
  constructor(context: Context) {
    this.#sockets = new InterpreterSockets(context)
  }

  async socketConnected(socket: Socket, handleErrors: SocketErrorHandler) {
    socket.on(
      'acceptInterpret',
      handleErrors(async (booth) => {
        await this.#sockets.acceptInterpret(socket.id, booth)
      })
    )

    socket.on(
      'joinBooth',
      handleErrors(async (booth) => {
        await this.#sockets.joinBooth(socket.id, booth)
      })
    )

    socket.on(
      'leaveBooth',
      handleErrors(async (booth) => {
        await this.#sockets.leaveBooth(socket.id, booth)
      })
    )

    socket.on(
      'messageBooth',
      handleErrors(async (booth, message) => {
        await this.#sockets.messageBooth(socket.id, booth, message)
      })
    )

    socket.on(
      'requestInterpreter',
      handleErrors(async (booth, duration) => {
        await this.#sockets.requestInterpreter(socket.id, booth, duration)
      })
    )

    socket.on(
      'sendAudio',
      handleErrors(async (rawData) => {
        await this.#sockets.sendAudio(socket.id, rawData)
      })
    )

    socket.on(
      'startInterpret',
      handleErrors(async (booth) => {
        await this.#sockets.startInterpret(socket.id, booth)
      })
    )

    socket.on(
      'stopInterpret',
      handleErrors(async (booth) => {
        await this.#sockets.stopInterpret(socket.id, booth)
      })
    )
  }

  async socketDisconnected(socket: Socket) {
    await this.#sockets.socketDisconnected(socket.id)
  }
}
