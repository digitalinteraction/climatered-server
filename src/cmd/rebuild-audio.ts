import fs = require('fs')
import path = require('path')
import waveheader = require('waveheader')

import createDebug = require('debug')
import { Stream } from 'stream'

const debug = createDebug('api:cmd:rebuild')

export async function runRebuilder(directory: string, outfile: string) {
  debug('start')
  const resolve = (file: string) => path.join(process.cwd(), directory, file)

  const contents = await fs.promises.readdir(resolve(''))
  debug('found %O', contents)

  contents.sort((a, b) => a.localeCompare(b))

  const buffers = await Promise.all(
    contents.map((file) => {
      const filepath = resolve(file)
      return fs.promises.readFile(filepath)
    })
  )

  const totalLength = buffers.reduce(
    (sum, buffer) => sum + buffer.byteLength,
    0
  )

  debug('totalLength=%d', totalLength)

  buffers.unshift(
    waveheader(totalLength * 8, {
      sampleRate: 16000,
      bitDepth: 8,
    })
  )

  const outputBuffer = Buffer.concat(buffers)

  await fs.promises.writeFile(path.join(process.cwd(), outfile), outputBuffer)
}
