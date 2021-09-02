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

  //
  // authenticate
  //
  console.log('auth %o', TOKEN)
  socket.emit('auth', TOKEN)
  await pause(1000)

  //
  // deauthenticate
  //
  console.log('deauth')
  socket.emit('deauth')
  await pause(1000)

  //
  // Close the socket
  //
  socket.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
