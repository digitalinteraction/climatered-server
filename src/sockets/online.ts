import { TypedChow } from '../server'
import createDebug = require('debug')
import _ = require('lodash')

const debug = createDebug('api:socket:online')

const EMIT_DEBOUNCE = 10 * 1000

export default function online(chow: TypedChow) {
  const pkg = require('../../package.json')

  //
  // @online()
  //
  chow.socket('online', async (ctx) => {
    const { socket, getSocketCount, emitToEveryone } = ctx
    debug(`socket="${socket.id}"`)

    const trigger = _.debounce(async () => {
      const count = await getSocketCount()
      emitToEveryone('site-visitors', count)
    }, EMIT_DEBOUNCE)

    await trigger()

    socket.once('disconnect', async () => trigger())

    const count = await getSocketCount()
    socket.emitBack('site-visitors', count)
  })
}
