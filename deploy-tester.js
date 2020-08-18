const got = require('got')
const { URL = 'https://climate.red' } = process.env

;(async () => {
  const interval = 100

  const codes = new Map()

  console.log('Starting url=%s, interval=%d', URL, interval)

  setInterval(async () => {
    const response = await got.get(URL)

    console.log(`- ${response.statusCode} ${response.statusMessage}`)

    codes.set(response.statusCode, (codes.get(response.statusCode) || 0) + 1)
  }, interval)

  function end() {
    console.log('\n\nResult')
    for (const [key, value] of codes.entries()) {
      console.log(`${key}: ${value}`)
    }
    process.exit(0)
  }

  process.on('SIGINT', () => end())
  process.on('SIGTERM', () => end())
})()
