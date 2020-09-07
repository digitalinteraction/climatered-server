import { Chow, BaseContext, Chowish } from '@robb_j/chowchow'

import socketIo = require('socket.io')
import socketIoRedis = require('socket.io-redis')
import { eventNames } from 'process'

export interface EmitToRoomFn {
  (room: string, eventName: string, ...args: any[]): void
}

export interface GetRoomClientFn {
  (rooms: string[]): Promise<string[]>
}

export interface GetClientRoomsFn {
  (clientId: string): Promise<string[]>
}

export interface EmitToSocketfn {
  (socketId: string, eventName: string, ...args: any[]): void
}

export interface SockContext<E> extends BaseContext<E> {
  emitToEveryone(eventName: string, ...args: any[]): void
  emitToRoom: EmitToRoomFn
  emitToSocket: EmitToSocketfn
  getRoomClients: GetRoomClientFn
  getClientRooms: GetClientRoomsFn
  getSocketCount(): Promise<number>
}

export interface ChowSocket {
  id: string
  join(room: string): void
  leave(room: string): void
  emitBack(eventName: string, ...args: any[]): void
  on(eventName: string, listener: (...args: any[]) => void): void
  once(eventName: string, listener: (...args: any[]) => void): void
}

interface SocketSendError {
  (message: string): void
}

interface SockHandler<C> {
  (
    ctx: C & { socket: ChowSocket; sendError: SocketSendError },
    ...args: any[]
  ): any | Promise<any>
}

export interface SockChowish<E, C extends SockContext<E>> {
  socket(message: string, handler: SockHandler<C>): void
  emitToRoom: EmitToRoomFn
  getRoomClients: GetRoomClientFn
}

function createSocket(socket: socketIo.Socket): ChowSocket {
  return {
    id: socket.id,
    join: (room) => socket.join(room),
    leave: (room) => socket.leave(room),
    emitBack: (eventName, ...args) => socket.emit(eventName, ...args),
    on: (eventName, listener) => socket.on(eventName, listener),
    once: (eventName, listener) => socket.on(eventName, listener),
  }
}

// type Middle = Chowish<E, C>, SockChowish<E, C>

export class SockChow<E, C extends SockContext<E>> extends Chow<E, C>
  implements SockChowish<E, C>, Chowish<E, C> {
  io = socketIo(this.server)
  socketHandlers = new Map<string, SockHandler<C>>()

  constructor(ctxFactory: (ctx: SockContext<E>) => C | Promise<C>, env: E) {
    super(env, ctxFactory as any)

    this.io.on('connection', (s) => this.handleSocket(s))
  }

  useRedis(redisUrl: string) {
    this.io.adapter(socketIoRedis(redisUrl))
  }

  socket(message: string, handler: SockHandler<C>) {
    this.socketHandlers.set(message, handler)
  }

  emitToRoom(room: string, eventName: string, ...args: any[]) {
    this.io.in(room).emit(eventName, ...args)
  }

  handleSocket(socket: socketIo.Socket) {
    for (const [message, handler] of this.socketHandlers) {
      socket.on(message, async (...args) => {
        try {
          const ack = args.slice(-1)[0]

          const result = await handler(
            {
              ...(await this.makeContext()),
              socket: createSocket(socket),
              sendError: (error) => {
                return this.catchSocketError(socket, message, error)
              },
            },
            ...args
          )

          // If they requested an acknowledgement, send back the result of the handler
          if (typeof ack === 'function') {
            ack(result)
          }
        } catch (error) {
          this.catchSocketError(socket, message, error)
        }
      })
    }
  }

  emitToEveryone(eventName: string, ...args: any[]) {
    this.io.emit(eventName, ...args)
  }

  async getSocketCount(): Promise<number> {
    const adapter = this.io.of('/').adapter as socketIoRedis.RedisAdapter

    const allRooms = await new Promise<string[]>((resolve, reject) => {
      adapter.allRooms((err, rooms) => {
        err ? reject(err) : resolve(rooms)
      })
    })

    const clients = await this.getRoomClients(allRooms)

    return clients.length
  }

  baseContext(): SockContext<E> {
    return {
      ...super.baseContext(),
      emitToRoom: (...args) => this.emitToRoom(...args),
      emitToSocket: (...args) => this.emitToSocket(...args),
      getRoomClients: (...args) => this.getRoomClients(...args),
      getClientRooms: (...args) => this.getClientRooms(...args),
      emitToEveryone: (...args) => this.emitToEveryone(...args),
      getSocketCount: () => this.getSocketCount(),
    }
  }

  emitToSocket(socketId: string, eventName: string, ...args: any[]) {
    this.io.to(socketId).emit(eventName, ...args)
  }

  getRoomClients(rooms: string[]) {
    const adapter = this.io.of('/').adapter as socketIoRedis.RedisAdapter

    return new Promise<string[]>((resolve, reject) => {
      adapter.clients(rooms, (err, clients) => {
        if (err) reject(err)
        else resolve(clients)
      })
    })
  }

  getClientRooms(clientId: string) {
    const adapter = this.io.of('/').adapter as socketIoRedis.RedisAdapter

    return new Promise<string[]>((resolve, reject) => {
      adapter.clientRooms(clientId, (err, rooms) => {
        if (err) reject(err)
        else resolve(rooms)
      })
    })
  }

  catchSocketError(socket: socketIo.Socket, message: string, error: any) {
    console.log('Socket error', {
      from: message,
      id: socket.id,
      error,
    })
  }
}
