import {
  ApiError,
  SocketService as DeconfSocketService,
} from '@openlab/deconf-api-toolkit'

export class SocketService implements Readonly<DeconfSocketService> {
  getRoomSize(roomName: string): Promise<number> {
    throw new Error('Method not implemented.')
  }
  getRoomSockets(roomName: string): Promise<string[]> {
    throw new Error('Method not implemented.')
  }
  joinRoom(socketId: string, roomName: string): void {
    throw new Error('Method not implemented.')
  }
  leaveRoom(socketId: string, roomName: string): void {
    throw new Error('Method not implemented.')
  }
  getSocketRooms(socketId: string): Promise<Set<string>> {
    throw new Error('Method not implemented.')
  }
  sendError(error: ApiError): void {
    throw new Error('Method not implemented.')
  }
  emitTo() {
    throw new Error('Method not implemented.')
  }
  emitToEveryone() {
    throw new Error('Method not implemented.')
  }
}
