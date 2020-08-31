require('dotenv').config()
const yargs = require('yargs')
const { validateEnv } = require('valid-env')
const io = require('socket.io-client')
const debug = require('debug')('api')

const AUDIO_SAMPLE_RATE = 16000 // per second

yargs.help().alias('h', 'help').demandCommand().recommendCommands()

function addSocket(apiUrl) {
  const pathname = new URL(apiUrl).pathname.replace(/\/?$/, '/socket.io')

  const socketUrl = new URL(apiUrl)
  socketUrl.pathname = '/'

  debug(`addSocket url="${socketUrl.toString()}" pathname="${pathname}"`)

  const socket = io(socketUrl.toString(), {
    path: pathname,
    reconnection: false,
    timeout: 1000,
    multiplex: false,
    forceNew: true,
  })

  socket.emitAndWait = (...args) => {
    return new Promise((resolve) => {
      socket.emit(...[...args, resolve])
    })
  }

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

      const socket = addSocket(args.url)
      let timerId = null

      process.on('SIGINT', async () => {
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

      process.on('SIGINT', async () => {
        setTimeout(() => die('Failed to disconnect'), 2000 + args.count * 200)

        if (timerId) clearInterval(timerId)

        await Promise.all(
          sockets.map(async (s) => {
            await s.emitAndWait('leave-channel', args.session, args.channel)
            s.close()
          })
        )

        die('recieved SIGINT')
      })

      for (let i = 0; i < args.count; i++) {
        sockets.push(addSocket(args.url))
      }

      debug('authing...')
      for (const sock of sockets) {
        sock.emit('auth', args.token)
        await pause(Math.random() * 300)
      }
      // await Promise.all(sockets.map((s) => s.emitAndWait('auth', args.token)))
      // debug('authed')

      await Promise.all(
        sockets.map((s) =>
          s.emitAndWait('join-channel', args.session, args.channel)
        )
      )
      debug('authed')

      await Promise.all(
        sockets.map((s) =>
          s.on('channel-data', () => {
            messages++
          })
        )
      )

      debug('subbed')

      let messages = 0

      timerId = setInterval(() => {
        console.log('recieved: ', messages)
        messages = 0
      }, 1000)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
)

yargs.parse()
