import { Chow, BaseContext, Chowish } from '@robb_j/chowchow'

import socketIo = require('socket.io')
import socketIoRedis = require('socket.io-redis')

export interface EmitToRoomFn {
  (room: string, message: string, ...args: any[]): void
}

export interface SockContext<E> extends BaseContext<E> {
  emitToRoom: EmitToRoomFn
}

export interface ChowSocket {
  id: string
  join(room: string): void
  leave(room: string): void
  emit(message: string, ...args: any[]): void
}

interface SocketSendError {
  (message: string): void
}

interface SockHandler<C> {
  (
    ctx: C & { socket: ChowSocket; sendError: SocketSendError },
    ...args: any[]
  ): void | Promise<void>
}

export interface SockChowish<E, C extends SockContext<E>> {
  socket(message: string, handler: SockHandler<C>): void
  emitToRoom: EmitToRoomFn
}

function createSocket(socket: socketIo.Socket): ChowSocket {
  return {
    id: socket.id,
    join: (room) => socket.join(room),
    leave: (room) => socket.leave(room),
    emit: (message, ...args) => socket.emit(message, ...args),
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

  emitToRoom(room: string, message: string, ...args: any[]) {
    this.io.in(room).emit(message, ...args)
  }

  handleSocket(socket: socketIo.Socket) {
    for (const [message, handler] of this.socketHandlers) {
      socket.on(message, async (...args) => {
        try {
          await handler(
            {
              ...(await this.makeContext()),
              socket: createSocket(socket),
              sendError: (error) => {
                return this.catchSocketError(socket, message, error)
              },
            },
            ...args
          )
        } catch (error) {
          this.catchSocketError(socket, message, error)
        }
      })
    }
  }

  baseContext(): SockContext<E> {
    return {
      ...super.baseContext(),
      emitToRoom: (room, message, ...args) =>
        this.emitToRoom(room, message, ...args),
    }
  }

  catchSocketError(socket: socketIo.Socket, message: string, error: any) {
    console.log('Socket error', {
      from: message,
      id: socket.id,
      error,
    })
  }
}
