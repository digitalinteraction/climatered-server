import path = require('path')
import os = require('os')
import fse = require('fs-extra')
import cp = require('child_process')
import glob = require('globby')
import rimraf = require('rimraf')
import parseFrontmatter = require('gray-matter')
import createDebug = require('debug')
import { promisify } from 'util'
import { validateEnv } from 'valid-env'
import { Struct, StructError } from 'superstruct'

import {
  validateStruct,
  SlotStruct,
  SessionStruct,
  TrackStruct,
  ThemeStruct,
  TranslatorStruct,
  SpeakerStruct,
  ConfigSettingsStruct,
  SessionTypeStruct,
} from '../structs'
import IORedis = require('ioredis')

const exec = promisify(cp.exec)
const debug = createDebug('api:content-scrape')

/** See what files are in a directory, read them in and validate against a struct */
async function readAndParse<T>(
  basePath: string,
  pattern: string,
  struct: Struct<T>
) {
  const log = debug.extend('readAndParse')

  // Find files that match the glob
  log(`pattern="${pattern}"`)
  const matches = await glob(pattern, { cwd: basePath })
  log(`found=${matches.length}`)

  // Build up a set of validation errors and valid records
  const errors: StructError[] = []
  const records: T[] = []

  // Process each file that matched the glob
  await Promise.all(
    matches.map(async (file) => {
      const slug = path.parse(file).name
      log(`file="${file}" slug="${slug}"`)

      // Read in the file
      const fullPath = path.join(basePath, file)
      const buffer = await fse.readFile(fullPath, 'utf8')

      // Parse the frontmatter data
      // note - markdown content is ignored
      const { data } = parseFrontmatter(buffer)
      data.slug = slug

      // Validate the structure of the frontmatter
      const [error, record] = validateStruct(data, struct)

      // If there was an error, store it
      // note - repurposes error.stack to point to the original file
      if (error) {
        error.stack = file
        errors.push(error)
      }

      // If it parsed the record, store that
      if (record) {
        records.push(record)
      }
    })
  )

  // Return
  log(`pattern="${pattern}" errors=${errors.length} records=${records.length}`)
  return [errors, records] as [StructError[], T[]]
}

async function readAndParseJson<T>(
  basePath: string,
  file: string,
  struct: Struct<T>
): Promise<[StructError, undefined] | [undefined, T]> {
  const log = debug.extend('readAndParseJson')

  const fullPath = path.join(basePath, file)

  log(`path="${fullPath}"`)
  try {
    const data = await fse.readJson(fullPath)

    return validateStruct(data, struct)
  } catch (error) {
    error.stack = fullPath
    return [error, undefined]
  }
}

/** Wrap exec to debug log it */
function debugExec(cmd: string) {
  debug(`exec cmd="${cmd}"`)
  return exec(cmd)
}

const {
  SCHEDULE_GIT_URL,
  REDIS_URL,
  SCHEDULE_GIT_BRANCH = 'master',
} = process.env as Record<string, string>

export async function runScraper() {
  const tmpdir = await fse.mkdtemp(path.join(os.tmpdir(), 'schedule-clone-'))

  debug(`runScraper tmpdir="${tmpdir}"`)

  // Ensure the correct environment variables are set
  validateEnv(['SCHEDULE_GIT_URL', 'REDIS_URL'])

  // Extract environment variables
  debug(`redisUrl="${REDIS_URL}" gitUrl="${SCHEDULE_GIT_URL}"`)

  // Connect to redis
  const redis = new IORedis(REDIS_URL)

  try {
    // Check the redis connection
    await new Promise((resolve, reject) => {
      redis.once('connect', () => resolve())
      redis.once('error', (e) => reject(e))
    })

    // Ensure we were passed a valid url
    const { stderr } = await debugExec(`git ls-remote ${SCHEDULE_GIT_URL}`)
    if (stderr) throw new Error(stderr)

    // Clone the schedule repo into the temp folder
    await debugExec(
      `git clone --branch ${SCHEDULE_GIT_BRANCH} ${SCHEDULE_GIT_URL} ${tmpdir}`
    )

    // Create a list of content to parse and validate
    const contentToParse: { key: string; struct: Struct<any> }[] = [
      { key: 'slots', struct: SlotStruct },
      { key: 'sessions', struct: SessionStruct },
      { key: 'tracks', struct: TrackStruct },
      { key: 'themes', struct: ThemeStruct },
      { key: 'speakers', struct: SpeakerStruct },
      { key: 'translators', struct: TranslatorStruct },
      { key: 'types', struct: SessionTypeStruct },
    ]

    // Generate an array of iterators that read in content and yield errors
    // then can be told to write to redis after
    const iterators = contentToParse.map(async function* ({ key, struct }) {
      const [errors, records] = await readAndParse(
        tmpdir,
        `${key}/*.md`,
        struct
      )

      yield errors

      await redis.set(`schedule.${key}`, JSON.stringify(records))
    })

    iterators.push(
      (async function* () {
        const [error, settings] = await readAndParseJson(
          tmpdir,
          'config/settings.json',
          ConfigSettingsStruct
        )

        const errors = error ? [error] : []

        yield errors

        await redis.set('schedule.settings', JSON.stringify(settings!))
      })()
    )

    // Read, parse and find errors
    // - Runs upto yield errors above for each item of contentToParse
    const firstRun = await Promise.all(iterators.map((it) => it.next()))
    const errors = firstRun.map((next) => next.value || []).flat()

    // Fail and exit now if there are any errors
    if (errors.length > 0) {
      console.error('Repo validation failed')
      errors.forEach((err) => console.error(`${err.stack}:\n${err.message}\n`))
      process.exitCode = 1
      return
    }

    // Write to redis
    debug('storing in redis')
    await Promise.all(iterators.map((it) => it.next()))
  } catch (error) {
    //
    // Catch any errors and exit with a failure
    //
    console.error(error)
    process.exitCode = 1
  } finally {
    //
    // Success or fail, always remove the tmpdir
    //
    debug(`rm -rf ${tmpdir}`)
    await new Promise((resolve, reject) =>
      rimraf(tmpdir, (err) => (err ? reject(err) : resolve(err)))
    )

    debug('disconnect from redis')
    await redis.quit()
  }
}
