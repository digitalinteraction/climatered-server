import { Server as SocketIoServer } from 'socket.io'

import {
  ApiError,
  SocketMessages,
  SocketService as DeconfSocketService,
} from '@openlab/deconf-api-toolkit'

import createDebug from 'debug'

const debug = createDebug('cr:lib:sockets-service')

/** NOTE: setIo must be called prior to use */
export class SocketService implements Readonly<DeconfSocketService> {
  get #io() {
    if (!this.#_io) throw new Error('SocketService used before it is ready')
    return this.#_io
  }

  #_io: SocketIoServer | undefined
  constructor() {}

  setIo(io: SocketIoServer) {
    this.#_io = io
  }

  emitToEveryone(eventName: string, ...args: unknown[]): void {
    debug('emitToEveryone event=%o', eventName)
    this.#io.emit(eventName, ...args)
  }

  emitTo(roomNameOrId: string, eventName: string, ...args: unknown[]): void {
    debug('emitTo to=%o event=%o', roomNameOrId, eventName)
    this.#io.in(roomNameOrId).emit(eventName, ...args)
  }

  joinRoom(socketId: string, roomName: string): void {
    debug('joinRoom socket=%o room=%o', socketId, roomName)
    this.#io.in(socketId).socketsJoin(roomName)
  }

  leaveRoom(socketId: string, roomName: string): void {
    debug('leaveRoom socket=%o room=%o', socketId, roomName)
    this.#io.in(socketId).socketsLeave(roomName)
  }

  async getRoomsOfSocket(socketId: string): Promise<Set<string>> {
    debug('getRoomsOfSocket socket=%o ', socketId)
    const sockets = await this.#io.in(socketId).fetchSockets()
    return sockets[0].rooms
  }

  async getSocketsInRoom(roomName: string): Promise<string[]> {
    debug('getSocketsInRoom room=%o ', roomName)
    const sockets = await this.#io.in(roomName).fetchSockets()
    return sockets.map((r) => r.id)
  }

  sendError(socketId: string, error: ApiError): void {
    debug('#sendError to=%o error=%O', socketId, error)
    this.#io.in(socketId).emit('apiError', {
      ...error,
      status: error.status,
      codes: error.codes,
      stack: error.stack,
    })
  }
}
