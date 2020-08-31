require('dotenv').config()
const yargs = require('yargs')
const ms = require('ms')
const { validateEnv } = require('valid-env')
const io = require('socket.io-client')
const debug = require('debug')('api')

const AUDIO_SAMPLE_RATE = 16000 // per second
const AUDIO_CHUNK_SIZE = 128 * 128 // bit per chunk

yargs.help().alias('h', 'help').demandCommand().recommendCommands()

async function dotty(pre, countOrIterator, block) {
  process.stdout.write(`${pre}: `)
  const start = Date.now()
  const promises = []

  const dot = () => process.stdout.write(`.`)

  if (countOrIterator[Symbol.iterator]) {
    for (const key in countOrIterator) {
      const object = countOrIterator[key]
      promises.push(block(object, key).then(dot))
    }
  } else if (typeof countOrIterator === 'number') {
    for (let i = 0; i < countOrIterator; i++) {
      promises.push(block(i).then(dot))
    }
  } else {
    throw new Error('#dotty countOrIterator not an iterator or number')
  }

  await Promise.all(promises)

  const dt = ms(Date.now() - start)
  process.stdout.write(` (${dt}) \n`)
}

function parseSocketUrl(apiUrl) {
  const pathname = new URL(apiUrl).pathname.replace(/\/?$/, '/socket.io')

  const socketUrl = new URL(apiUrl)
  socketUrl.pathname = '/'

  debug(`parseSocketUrl url="${socketUrl.toString()}" pathname="${pathname}"`)

  return [socketUrl.toString(), pathname]
}

async function addSocket(socketUrl, pathname) {
  const socket = io(socketUrl, {
    path: pathname,
    transports: ['websocket'],
    autoConnect: false,
  })

  //
  // RUN WITH socket debug to see where ping timeouts are coming from
  //

  socket.connect()

  await new Promise((resolve, reject) => {
    socket.once('connect', resolve)
    socket.once('connect_error', reject)
  })

  socket.emitAndWait = (...args) => {
    return new Promise((resolve) => {
      socket.emit(...[...args, resolve])
    })
  }

  socket.on('disconnect', (reason) => {
    if (reason === 'io client disconnect') return
    console.log('socket disconnect:', reason)
  })

  // socket.on('connect_error', (err) => {
  //   console.error(err)
  // })

  return socket
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeNoise(size) {
  const arr = new Float32Array(size)
  const volume = 0.7

  for (let i in arr) {
    arr[i] = volume * (Math.random() * 2 - 1)
  }
  return arr.buffer
}

function die(message, error) {
  if (message) {
    console.log(message)
  }
  if (error) {
    console.error(error)
    process.exitCode = 1
  }
  process.exit()
}

yargs.command(
  'translate <session> <channel>',
  'Become a translator and transmit white noise',
  (yargs) =>
    yargs
      .option('url', { type: 'string', default: process.env.TEST_SERVER })
      .option('token', { type: 'string', default: process.env.TEST_TOKEN })
      .positional('session', { type: 'string' })
      .positional('channel', { type: 'string' }),
  async (args) => {
    try {
      debug('translator')

      const [socketUrl, pathname] = parseSocketUrl(args.url)

      const socket = await addSocket(socketUrl, pathname)
      let timerId = null

      signal('SIGINT', async () => {
        setTimeout(() => die('Failed to disconnect'), 2000)

        await socket.emitAndWait('stop-interpret', args.session, args.channel)
        debug('stop-interpret')

        await socket.emitAndWait('leave-interpret', args.session, args.channel)
        debug('leave-interpret')

        socket.close()
        clearInterval(timerId)

        die('recieved SIGINT')
      })

      await socket.emitAndWait('auth', args.token)
      debug('auth')

      await socket.emitAndWait('join-interpret', args.session, args.channel)
      debug('join-interpret')

      await socket.emitAndWait('start-interpret', args.session, args.channel)
      debug('start-interpret')

      const sampleLengthSeconds = 0.5

      timerId = setInterval(async () => {
        await socket.emitAndWait(
          'send-interpret',
          makeNoise(sampleLengthSeconds * AUDIO_SAMPLE_RATE)
        )
        debug('send-interpret')
      }, sampleLengthSeconds * 1000)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
)

yargs.command(
  'load-up <count> <session> <channel>',
  'Add attendees to a session',
  (yargs) =>
    yargs
      .positional('count', { type: 'number' })
      .positional('session', { type: 'string' })
      .positional('channel', { type: 'string' })
      .option('url', { type: 'string', default: process.env.TEST_SERVER })
      .option('token', { type: 'string', default: process.env.TEST_TOKEN }),
  async (args) => {
    try {
      debug('load-up')

      /** @type {SocketIOClient.Socket[]} */
      const sockets = []
      let timerId = null

      onSignal('SIGINT', async () => {
        console.log()
        setTimeout(() => die('Failed to disconnect'), 2000 + args.count * 200)

        if (timerId) clearInterval(timerId)

        await dotty(
          `leave-channel ${args.session} ${args.channel}`,
          sockets.filter((s) => s.connected),
          async (sock) => {
            await sock.emitAndWait('leave-channel', args.session, args.channel)
            sock.close()
          }
        )

        die('recieved SIGINT')
      })

      const [socketUrl, pathname] = parseSocketUrl(args.url)

      await dotty(`adding ${args.count} sockets`, args.count, async () => {
        sockets.push(await addSocket(socketUrl, pathname))
      })

      await dotty('auth + join', sockets, async (sock) => {
        await sock.emitAndWait('auth', args.token)
        await sock.emitAndWait('join-channel', args.session, args.channel)
      })

      for (const sock of sockets) {
        sock.on('channel-data', () => {
          messages++
        })
      }

      let messages = 0
      const interval = (AUDIO_SAMPLE_RATE / AUDIO_CHUNK_SIZE) * 1000

      timerId = setInterval(() => {
        console.log('recieved: ', messages)
        messages = 0
      }, interval * 2)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
)

function onSignal(signal, block) {
  let called = false
  process.on(signal, async () => {
    if (called) {
      console.log('Forcing leave')
      process.exit(1)
    }
    called = true
    await block()
  })
}

yargs.parse()
