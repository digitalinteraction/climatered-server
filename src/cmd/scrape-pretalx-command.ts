import {
  AppConfigStruct,
  createDebug,
  PretalxConfig,
  RedisService,
} from '../lib/module.js'
import { checkEnvObject, pluck } from 'valid-env'
import {
  loadConfig,
  PretalxQuestion,
  PretalxService,
  PretalxTalk,
} from '@openlab/deconf-api-toolkit'
import {
  ScheduleRecord,
  Session,
  SessionType,
  Theme,
} from '@openlab/deconf-shared'

const debug = createDebug('cr:cmd:scrape-pretalx')

export interface ScrapePretalxCommandOptions {}
export interface PretalxDataCommand {
  (): Promise<void>
}

async function setup() {
  const env = checkEnvObject(
    pluck(process.env, 'PRETALX_API_TOKEN', 'REDIS_URL')
  )
  const appConfig = await loadConfig('app-config.json', AppConfigStruct)
  const config = appConfig.pretalx
  const store = new RedisService(env.REDIS_URL)
  const locales = [
    { id: 1, name: 'English', locale: 'en' },
    { id: 2, name: 'French', locale: 'fr' },
    { id: 3, name: 'Spanish', locale: 'es' },
    { id: 4, name: 'Arabic', locale: 'ar' },
  ]
  const pretalx = new PretalxService({ env, store, config, locales })

  return { env, config, store, locales, pretalx }
}

//
// Commands
//

export async function scrapePretalxCommand(
  options: ScrapePretalxCommandOptions
) {
  debug('start')

  const { pretalx, store, config } = await setup()

  const submissions = await pretalx.getSubmissions()
  const talks = await pretalx.getTalks()
  const event = await pretalx.getEvent()
  const speakers = await pretalx.getSpeakers()
  const questions = await pretalx.getQuestions()

  const schedule: Omit<ScheduleRecord, 'settings'> = {
    // sessions: getSessions(pretalx, submissions, config),
    sessions: [],
    slots: pretalx.getDeconfSlots(talks),
    speakers: pretalx.getDeconfSpeakers(
      speakers,
      config.questions.speakerAffiliation
    ),
    themes: getThemes(pretalx, questions, config),
    tracks: [],
    types: getTypes(pretalx, config),
  }

  await store.close()
}

function dataCommand(block: (pretalx: PretalxService) => Promise<unknown>) {
  return async () => {
    const { pretalx, store } = await setup()
    const result = await block(pretalx)
    console.log(JSON.stringify(result, null, 2))
    await store.close()
  }
}

export const pretalxDataCommands: Record<
  string,
  PretalxDataCommand | undefined
> = {
  questions: dataCommand((p) => p.getQuestions()),
  event: dataCommand((p) => p.getEvent()),
  submissions: dataCommand((p) => p.getSubmissions()),
  talks: dataCommand((p) => p.getTalks()),
  speakers: dataCommand((p) => p.getSpeakers()),
  tags: dataCommand((p) => p.getTags()),
}

//
// Helpers
//
function getTypes(pretalx: PretalxService, config: PretalxConfig) {
  return config.types as SessionType[]
}

function getThemes(
  pretalx: PretalxService,
  questions: PretalxQuestion[],
  config: PretalxConfig
): Theme[] {
  const themeQuestion = questions.find((q) => q.id === config.questions.theme)
  if (!themeQuestion) {
    throw new Error('Theme question not found')
  }

  return themeQuestion.options.map((option) => ({
    id: pretalx.getIdFromTitle(option.answer, 'unknown'),
    title: option.answer,
  }))
}

// TODO:
//
// function getSessions(
//   pretalx: PretalxService,
//   submissions: PretalxTalk[],
//   config: PretalxConfig
//   ): Session[] {
//   return submissions.map(submission => {

//   })
// }
