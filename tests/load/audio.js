require('dotenv').config()
const { validateEnv } = require('valid-env')
const io = require('socket.io-client')
const ms = require('ms')
const debug = require('debug')('api')

validateEnv(['ATTENDEE_TOKEN', 'TRANSLATOR_TOKEN'])
const {
  SERVER_URL = 'http://localhost:3000',
  ATTENDEE_TOKEN,
  TRANSLATOR_TOKEN,
  TEST_SESSION = 'dev-001',
  TEST_CHANNEL = 'fr',
} = process.env

const SOCKET_URL = SERVER_URL.replace(/^http/, 'ws')

/**
 * @returns {Promise<SocketIOClient.Socket>} name
 */
async function addSocket() {
  const socket = io(SOCKET_URL, {
    reconnection: false,
    timeout: 1000,
  })

  socket.emitAndWait = (msg, ...args) => {
    return new Promise((resolve) => {
      socket.emit(...[msg, ...args, resolve])
    })
  }

  return socket
}

async function time(name, block) {
  const start = Date.now()
  process.stdout.write(name + ' - ')
  await block()
  const duration = Date.now() - start
  console.log(ms(duration))
  return duration
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

//
// Test entrypoint
//
;(async () => {
  try {
    //
    // Test 1
    //
    await helloWorld()

    //
    // Test 2
    //
    const packetSize = 16 * 1024
    const numPackets = 10

    const small = await loadTest(10, packetSize, numPackets)
    const medium = await loadTest(100, packetSize, numPackets)
    const large = await loadTest(1000, packetSize, numPackets)

    const all = { small, medium, large }

    for (const [name, set] of Object.entries(all)) {
      console.log('=====================')
      console.log(name)
      console.log('  attendees:', set.numAttendees)
      console.log('  packetSize:', set.packetSize)
      console.log('  startup:', ms(set.startup))
      console.log('  sending:', ms(set.sending / numPackets))
      console.log('  shutdown:', ms(set.shutdown))
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()

async function helloWorld() {
  const s1 = await addSocket()

  console.log('→ "hi"')
  s1.emit('hi')

  const result = await new Promise((resolve) => {
    s1.on('hi', (data) => resolve(data))
  })

  console.log('←', result)

  s1.close()
}

function makeNoise(size) {
  const arr = new Float32Array(size / 4)
  for (let i in arr) {
    arr[i] = Math.random() * 2 - 1
  }
  return arr.buffer
}

async function loadTest(numAttendees, packetSize, numPackets) {
  const log = debug.extend('loadTest')

  log(
    `numAttendees=${numAttendees} packetSize=${packetSize} numPackets=${numPackets}`
  )

  let t
  let startup = await time('auth translator', async () => {
    t = await addSocket()
    await t.emitAndWait('auth', TRANSLATOR_TOKEN)
    await t.emitAndWait('join-interpret', TEST_SESSION, TEST_CHANNEL)
    await t.emitAndWait('start-interpret', TEST_SESSION, TEST_CHANNEL)
  })

  const attendees = []
  startup += await time('add attendees', async () => {
    for (let i = 0; i < numAttendees; i++) {
      const a = await addSocket()
      await a.emitAndWait('auth', ATTENDEE_TOKEN)
      await a.emitAndWait('join-channel', TEST_SESSION, TEST_CHANNEL)
      attendees.push(a)
    }
  })

  const waitForData = (s) => {
    return new Promise((resolve) => s.once('channel-data', resolve))
  }

  let sending = Date.now()

  for (let i = 0; i < numPackets; i++) {
    const whiteNoise = makeNoise(packetSize)

    await time(`send data ${i + 1}`, async () => {
      await t.emitAndWait('send-interpret', whiteNoise)
      await Promise.all(attendees.map((a) => waitForData(a)))
    })
  }
  sending = (Date.now() - sending) / numPackets

  log('shutdown')
  let shutdown = await time('deauth attendees', async () => {
    for (const a of attendees) {
      await a.emitAndWait('deauth')
      a.close()
    }
  })

  shutdown += await time('deauth translator', async () => {
    await t.emit('stop-interpret')
    await t.emit('leave-interpret', TEST_SESSION, TEST_CHANNEL)
    await t.emitAndWait('deauth')
    t.close()
  })

  return { startup, shutdown, sending, numAttendees, packetSize }
}
