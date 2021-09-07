import path from 'path'
import fs from 'fs/promises'
import cp from 'child_process'
import { promisify } from 'util'
import { createDebug, createEnv, RedisService } from '../lib/module'
import { assert as assertStruct } from 'superstruct'
import { ConferenceConfigStruct } from '@openlab/deconf-api-toolkit/dist/module'

const debug = createDebug('cr:cmd:fetch-content')
const asyncExec = promisify(cp.exec)

function exec(cmd: string) {
  debug('exec %o', cmd)
  return asyncExec(cmd)
}

async function validateSettings(tmpdir: string) {
  const file = path.join(tmpdir, 'content/settings.json')
  try {
    debug('checking settings %o', file)
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch (error) {
    console.error('Error with settings.json')
    console.error(error)
    throw error
  }
}
async function validateContent(tmpdir: string, dir: string) {
  debug('validateContent %o', dir)
  try {
    return {
      en: await fs.readFile(path.join(tmpdir, dir, 'en.md'), 'utf8'),
      fr: await fs.readFile(path.join(tmpdir, dir, 'fr.md'), 'utf8'),
      es: await fs.readFile(path.join(tmpdir, dir, 'es.md'), 'utf8'),
      ar: await fs.readFile(path.join(tmpdir, dir, 'ar.md'), 'utf8'),
    }
  } catch (error) {
    console.error('Error reading content ')
    throw error
  }
}

async function* contentInterator(tmpdir: string, keys: string[]) {
  const content: Array<{ key: string; files: Record<string, string> }> = []

  debug('contentInterator validating %o', keys)
  for (const key of keys) {
    content.push({
      key,
      files: await validateContent(tmpdir, path.join('content', key)),
    })
  }

  const redis: RedisService = yield

  debug('contentInterator storing %o', keys)
  for (const { key, files } of content) {
    await redis.put(`content.${key}`, files)
  }
}

export const CONTENT_KEYS = [
  'about',
  'atrium-active',
  'guidelines',
  'privacy',
  'terms',
]

export interface FetchContentCommandOptions {
  remote: string
  branch: string
}

export async function fetchContentCommand(options: FetchContentCommandOptions) {
  const env = createEnv()
  if (!env.REDIS_URL) throw new Error('REDIS_URL not set')

  const redis = new RedisService(env.REDIS_URL)
  const tmpdir = await fs.mkdtemp('content_')

  debug('start tmpdir=%o', tmpdir)

  // Ensure we were passed a valid url
  const { stderr } = await exec(`git ls-remote ${options.remote}`)
  if (stderr) throw new Error(stderr)

  try {
    // Clone the content repo into a temporary directory
    await exec(
      `git clone --branch ${options.branch} ${options.remote} "${tmpdir}"`
    )

    // Get and validate settings
    const settings = await validateSettings(tmpdir)

    // Get and validate page content
    const content = contentInterator(tmpdir, CONTENT_KEYS)
    await content.next()

    // Put settings into redis
    await redis.put('schedule.settings', settings)

    // Put content into redis
    await content.next(redis)
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await exec(`rm -rf "${tmpdir}"`)
    await redis.close()
  }
}
