import fs from 'fs/promises'
import path from 'path'
import waveheader from 'waveheader'

import { createDebug } from '../lib/module'

const debug = createDebug('cr:cmd:rebuild-audio')

export interface RebuildAudioCommandOptions {
  directory: string
  outfile: string
}

export async function rebuildAudioCommand({
  directory,
  outfile,
}: RebuildAudioCommandOptions) {
  debug('start')
  const resolve = (file: string) => path.join(process.cwd(), directory, file)

  const contents = await fs.readdir(resolve(''))
  debug('found %o files', contents.length)

  contents.sort((a, b) => a.localeCompare(b))

  const buffers = await Promise.all(
    contents.map((file) => fs.readFile(resolve(file)))
  )

  const totalLength = buffers.reduce(
    (sum, buffer) => sum + buffer.byteLength,
    0
  )

  debug('%o bytes', totalLength)

  buffers.unshift(
    waveheader(totalLength * 8, {
      sampleRate: 16000,
      bitDepth: 16,
    })
  )

  const outputBuffer = Buffer.concat(buffers)
  const destinationFile = path.join(process.cwd(), outfile)
  debug('destinationFile %o', destinationFile)

  await fs.writeFile(destinationFile, outputBuffer)
}
