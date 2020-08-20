import { TypedChow } from '../server'
import createDebug = require('debug')

const debug = createDebug('api:socket:hi')

export default function hi(chow: TypedChow) {
  const pkg = require('../../package.json')

  //
  // @hi()
  //
  chow.socket('hi', async (ctx) => {
    const { socket } = ctx
    debug(`socket="${socket.id}"`)

    socket.emitBack('hi', {
      message: 'Hello, world!',
      pkg: {
        name: pkg.name,
        version: pkg.version,
      },
    })
  })
}
