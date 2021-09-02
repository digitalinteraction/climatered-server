import { Server as SocketIoServer } from 'socket.io'

import {
  ApiError,
  SocketMessages,
  SocketService as DeconfSocketService,
} from '@openlab/deconf-api-toolkit'

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
    this.#io.emit(eventName, ...args)
  }

  emitTo<T extends SocketMessages>(
    roomNameOrId: string,
    eventName: string,
    ...args: unknown[]
  ): void {
    this.#io.to(roomNameOrId).emit(eventName, ...args)
  }

  joinRoom(socketId: string, roomName: string): void {
    this.#io.in(socketId).socketsJoin(roomName)
  }

  leaveRoom(socketId: string, roomName: string): void {
    this.#io.in(socketId).socketsLeave(roomName)
  }

  async getRoomsOfSocket(socketId: string): Promise<Set<string>> {
    const sockets = await this.#io.in(socketId).fetchSockets()
    return sockets[0].rooms
  }

  async getSocketsInRoom(roomName: string): Promise<string[]> {
    const sockets = await this.#io.in(roomName).fetchSockets()
    return sockets.map((r) => r.id)
  }

  sendError(error: ApiError): void {
    // ... TBR
  }
}
