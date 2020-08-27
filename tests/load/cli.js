require('dotenv').config()
const yargs = require('yargs')
const { validateEnv } = require('valid-env')
const io = require('socket.io-client')
const debug = require('debug')('api')

const AUDIO_SAMPLE_RATE = 44100 // per second

yargs.help().alias('h', 'help').demandCommand().recommendCommands()

async function addSocket(apiUrl) {
  const pathname = new URL(apiUrl).pathname.replace(/\/?$/, '/socket.io')

  const socketUrl = new URL(apiUrl)
  socketUrl.pathname = '/'

  const socket = io(socketUrl.toString(), {
    path: pathname,
    reconnection: false,
    timeout: 1000,
  })

  socket.emitAndWait = (...args) => {
    return new Promise((resolve) => {
      socket.emit(...[...args, resolve])
    })
  }

  return socket
}

function pause(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

function makeNoise(size) {
  const arr = new Float32Array(size / 4)
  for (let i in arr) {
    arr[i] = Math.random() * 2 - 1
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
      .option('url', {
        type: 'string',
        default: 'wss://dev.climate.red/api/',
      })
      .option('token', {
        type: 'string',
        default: process.env.TRANSLATOR_TOKEN,
      })
      .positional('session', {
        type: 'string',
      })
      .positional('channel', {
        type: 'string',
      }),
  async (args) => {
    try {
      debug('translator')

      const socket = await addSocket(args.url)

      process.on('SIGINT', async () => {
        await socket.emitAndWait('stop-interpret', args.session, args.channel)
        debug('stop-interpret')

        await socket.emitAndWait('leave-interpret', args.session, args.channel)
        debug('leave-interpret')

        die('Recieved SIGINT')
      })

      await socket.emitAndWait('auth', args.token)
      debug('auth')

      await socket.emitAndWait('join-interpret', args.session, args.channel)
      debug('join-interpret')

      await socket.emitAndWait('start-interpret', args.session, args.channel)
      debug('start-interpret')

      const sampleLengthSeconds = 0.5

      setInterval(async () => {
        const noise = makeNoise(sampleLengthSeconds * AUDIO_SAMPLE_RATE)

        await socket.emitAndWait('send-interpret', noise)
        debug('send-interpret')
      }, sampleLengthSeconds * 1000)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
)

yargs.parse()
