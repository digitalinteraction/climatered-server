import path from 'path'
import fs from 'fs/promises'
import cp from 'child_process'
import { promisify } from 'util'

import { assert as assertStruct } from 'superstruct'
import { ConferenceConfigStruct } from '@openlab/deconf-api-toolkit'

import { remark } from 'remark'
import remarkHtml from 'remark-html'
import { findAndReplace } from 'mdast-util-find-and-replace'
import { u } from 'unist-builder'

import { createDebug, createEnv, RedisService } from '../lib/module.js'

const debug = createDebug('cr:cmd:fetch-content')
const asyncExec = promisify(cp.exec)

function exec(cmd: string) {
  debug('exec %o', cmd)
  return asyncExec(cmd)
}

export const CONTENT_KEYS = [
  'about',
  'atrium-public',
  'atrium-active',
  'guidelines',
  'privacy',
  'terms',
  'faqs',
]

export interface FetchContentCommandOptions {
  remote: string
  branch: string
  reuse?: string
}

export async function fetchContentCommand(options: FetchContentCommandOptions) {
  const env = createEnv()
  if (!env.REDIS_URL) throw new Error('REDIS_URL not set')

  const redis = new RedisService(env.REDIS_URL)
  const repoDir = options.reuse ?? (await fs.mkdtemp('content_'))

  debug('start tmpdir=%o', repoDir)

  // Ensure we were passed a valid url
  if (!options.reuse) {
    const { stderr } = await exec(`git ls-remote ${options.remote}`)
    if (stderr) throw new Error(stderr)
  }

  try {
    // Clone the content repo into a temporary directory
    if (!options.reuse) {
      await exec(
        `git clone --branch ${options.branch} ${options.remote} "${repoDir}"`
      )
    }

    // Get and validate settings
    const settings = await validateSettings(repoDir)

    // Get and validate page content
    const content = contentInterator(repoDir, CONTENT_KEYS)
    await content.next()

    // Put settings into redis
    await redis.put('schedule.settings', settings)

    // Put content into redis
    await content.next(redis)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    if (!options.reuse) {
      await exec(`rm -rf "${repoDir}"`)
    }

    await redis.close()
  }
}

//
// Helpers
//

async function validateSettings(tmpdir: string) {
  const file = path.join(tmpdir, 'content/settings.json')
  try {
    debug('checking settings %o', file)
    const settings = JSON.parse(await fs.readFile(file, 'utf8'))

    if (settings.startDate) settings.startDate = new Date(settings.startDate)
    if (settings.endDate) settings.endDate = new Date(settings.endDate)

    assertStruct(settings, ConferenceConfigStruct)
    return settings
  } catch (error) {
    console.error('Error with settings.json')
    console.error(error)
    throw error
  }
}

async function processMarkdown(file: string) {
  const markdown = await fs.readFile(file, 'utf8')

  return remark()
    .use(remarkHtml, {
      sanitize: false,
    })
    .use(() => {
      return (rootNode) => {
        findAndReplace(rootNode, /^%+(.+)%+$/, (match, id) =>
          u('html', `<div id="${id}"></div>`)
        )
      }
    })
    .processSync(markdown)
    .toString()
}

async function validateContent(repoDir: string, dir: string) {
  debug('validateContent %o', dir)
  try {
    return {
      en: await processMarkdown(path.join(repoDir, dir, 'en.md')),
      fr: await processMarkdown(path.join(repoDir, dir, 'fr.md')),
      es: await processMarkdown(path.join(repoDir, dir, 'es.md')),
      ar: await processMarkdown(path.join(repoDir, dir, 'ar.md')),
    }
  } catch (error) {
    console.error('Error reading content')
    throw error
  }
}

async function* contentInterator(repoDir: string, keys: string[]) {
  const content: Array<{ key: string; files: Record<string, string> }> = []

  debug('contentInterator validating %o', keys)
  for (const key of keys) {
    const files = await validateContent(repoDir, path.join('content', key))
    content.push({ key, files })
  }

  const redis: RedisService = yield

  debug('contentInterator storing %o', keys)
  for (const { key, files } of content) {
    await redis.put(`content.${key}`, files)
  }
}
