import { InterpreterSockets } from '@openlab/deconf-api-toolkit'
import { Socket } from 'socket.io'
import {
  AppBroker,
  AppContext,
  createDebug,
  SocketErrorHandler,
} from '../lib/module.js'

const debug = createDebug('cr:broker:interpret')

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
        debug('acceptInterpret %o %o', socket.id, booth)
        await this.#sockets.acceptInterpret(socket.id, booth)
      })
    )

    socket.on(
      'joinBooth',
      handleErrors(async (booth) => {
        debug('joinBooth %o %o', socket.id, booth)
        await this.#sockets.joinBooth(socket.id, booth)
      })
    )

    socket.on(
      'leaveBooth',
      handleErrors(async (booth) => {
        debug('leaveBooth %o %o', socket.id, booth)
        await this.#sockets.leaveBooth(socket.id, booth)
      })
    )

    socket.on(
      'messageBooth',
      handleErrors(async (booth, message) => {
        debug('messageBooth %o %o', socket.id, booth)
        await this.#sockets.messageBooth(socket.id, booth, message)
      })
    )

    socket.on(
      'requestInterpreter',
      handleErrors(async (booth, duration) => {
        debug('requestInterpreter %o %o', socket.id, booth)
        await this.#sockets.requestInterpreter(socket.id, booth, duration)
      })
    )

    socket.on(
      'sendAudio',
      handleErrors(async (rawData) => {
        debug('sendAudio %o', socket.id)
        await this.#sockets.sendAudio(socket.id, rawData)
      })
    )

    socket.on(
      'startInterpret',
      handleErrors(async (booth) => {
        debug('startInterpret %o %o', socket.id, booth)
        await this.#sockets.startInterpret(socket.id, booth)
      })
    )

    socket.on(
      'stopInterpret',
      handleErrors(async (booth) => {
        debug('stopInterpret %o %o', socket.id, booth)
        await this.#sockets.stopInterpret(socket.id, booth)
      })
    )
  }

  async socketDisconnected(socket: Socket) {
    await this.#sockets.socketDisconnected(socket.id)
  }
}
