import { io } from 'socket.io-client'

function pause(ms) {
  console.log('pause %o ms', ms)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const { TOKEN } = process.env
  if (!TOKEN) throw new Error("'TOKEN' not set")

  const socket = io('http://localhost:3000')

  socket.on('api_error', (error) => {
    console.error('ApiError status=%o codes=%o', error.status, error.codes)
  })

  socket.on('site-visitors', (visitors) => {
    console.log('site-visitors %o', visitors)
  })

  //
  // An unauthenticated metric
  //
  await pause(1000)
  console.log('trackMetric')
  socket.emit('trackMetric', 'page-view', {
    page: '/about',
  })

  //
  // authenticate
  //
  await pause(1000)
  console.log('auth')
  socket.emit('auth', TOKEN)

  //
  // An authenticated metric
  //
  await pause(1000)
  console.log('trackMetric')
  socket.emit('trackMetric', 'page-view', {
    page: '/about',
  })

  //
  // An error
  //
  await pause(1000)
  const error = new Error('Something went wrong')
  console.log('trackError')
  socket.emit('trackError', {
    message: error.message,
    stack: error.stack,
  })

  //
  // More sockets (wait for site-visitors)
  //
  const moreSockets = [
    io('http://localhost:3000'),
    io('http://localhost:3000'),
    io('http://localhost:3000'),
    io('http://localhost:3000'),
    io('http://localhost:3000'),
  ]
  await pause(7000)

  //
  // Close
  //
  await pause(1000)
  socket.close()
  moreSockets.forEach((s) => s.close())
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
