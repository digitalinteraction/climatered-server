import ms from 'ms'
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
  PretalxSpeaker,
  PretalxTalk,
  SemaphoreService,
} from '@openlab/deconf-api-toolkit'
import {
  ScheduleRecord,
  SessionType,
  Session,
  Theme,
  SessionVisibility,
  SessionState,
  LocalisedLink,
  Localised,
} from '@openlab/deconf-shared'

const debug = createDebug('cr:cmd:scrape-pretalx')
const SCRAPE_LOCK_KEY = 'pretalx_lock'
const SCRAPE_MAX_LOCK = ms('10m')

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
  const pretalx = new PretalxService({ env, store, config })

  const semaphore = new SemaphoreService({ store })

  return { env, config, store, pretalx, semaphore }
}

//
// Commands
//

export async function scrapePretalxCommand(
  options: ScrapePretalxCommandOptions
) {
  debug('start')

  const { pretalx, store, config, semaphore } = await setup()
  const { getSessions, getThemes } = getHelpers(pretalx, config)

  const hasLock = await semaphore.aquire(SCRAPE_LOCK_KEY, SCRAPE_MAX_LOCK)
  if (!hasLock) {
    throw new Error(`Failed to aquire lock "${SCRAPE_LOCK_KEY}"`)
  }

  try {
    const submissions = await pretalx.getSubmissions()
    const talks = await pretalx.getTalks()
    const speakers = await pretalx.getSpeakers()
    const questions = await pretalx.getQuestions()

    const speakerMap = new Map(speakers.map((s) => [s.code, s]))

    const schedule: Omit<ScheduleRecord, 'settings'> = {
      sessions: getSessions(submissions, speakerMap),
      slots: pretalx.getDeconfSlots(talks),
      speakers: pretalx.getDeconfSpeakers(
        speakers,
        config.questions.speakerAffiliation
      ),
      themes: getThemes(questions),
      tracks: [],
      types: config.types as SessionType[],
    }

    for (const [key, value] of Object.entries(schedule)) {
      await store.put(`schedule.${key}`, value)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  } finally {
    await semaphore.release(SCRAPE_LOCK_KEY)
    await store.close()
  }
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

function getHelpers(pretalx: PretalxService, config: PretalxConfig) {
  function getSessionHost(
    talk: PretalxTalk,
    speakers: Map<string, PretalxSpeaker>
  ): Localised {
    // If there is an answer to the session host question, use that
    const hostOrg = pretalx.findAnswer(
      config.questions.sessionOrganisation,
      talk.answers
    )
    if (hostOrg) return { en: hostOrg }

    // Try to combine speaker's organisations
    const speakerHosts = new Map<string, string>()
    for (const inlineSpeaker of talk.speakers) {
      const speaker = speakers.get(inlineSpeaker.code)
      if (!speaker) continue
      const answer = speaker.answers.find(
        (a) => a.question.id === config.questions.speakerOrganisation
      )
      if (!answer) continue

      speakerHosts.set(pretalx.getSlug(answer.answer), answer.answer)
    }

    return {
      en: Array.from(speakerHosts.values()).join('/'),
    }
  }

  function getSessions(
    submissions: PretalxTalk[],
    speakers: Map<string, PretalxSpeaker>
  ): Session[] {
    return submissions.map((submission) => {
      const type = pretalx.getIdFromTitle(submission.submission_type, 'unknown')

      const slot = submission.slot
        ? pretalx.getSlotId(submission.slot)
        : undefined

      const track = pretalx.getIdFromTitle(submission.track, 'unknown')

      const themesAnswer = submission.answers.find(
        (a) => a.question.id === config.questions.theme
      )
      const themes = themesAnswer?.options.map((o) => o.id.toString()) ?? []

      return {
        id: pretalx.makeUnique(submission.code),
        type,
        title: getSessionText(
          submission,
          config.questions.title,
          submission.title
        ),
        slot,
        track,
        themes,
        coverImage: '',
        content: getSessionText(
          submission,
          config.questions.description,
          submission.description
        ),
        links: getSessionLinks(submission),
        hostLanguages: getSessionLanguages(submission),
        enableInterpretation: getBoolean(
          submission,
          config.questions.interpretation
        ),
        speakers: submission.speakers.map((s) => s.code),
        hostOrganisation: getSessionHost(submission, speakers),
        isRecorded: getBoolean(submission, config.questions.recorded),
        isOfficial: false,
        isFeatured: submission.is_featured,
        visibility: SessionVisibility.private,
        state: submission.state as SessionState,
        participantCap: pretalx.getSessionCap(
          submission,
          config.questions.capacity
        ),

        proxyUrl: undefined,
        hideFromSchedule: false,

        contactEmail: pretalx.findAnswer(
          config.questions.contactEmail,
          submission.answers
        ),
      }
    })
  }

  function getThemes(questions: PretalxQuestion[]) {
    const question = questions.find((q) => q.id === config.questions.theme)
    if (!question) {
      throw new Error(`Themes question not found "${config.questions.theme}"`)
    }
    const themes: Theme[] = question.options.map((option) => ({
      id: option.id.toString(),
      title: option.answer,
    }))

    return themes
  }

  function getSessionLanguages(submission: PretalxTalk) {
    const result = [submission.content_locale]

    const answer = submission.answers.find(
      (a) => a.question.id === config.questions.languages
    )

    for (const option of answer?.options ?? []) {
      const locale = config.languages[option.id.toString()]
      if (!locale || result.includes(locale)) continue
      result.push(locale)
    }

    return result
  }

  function getSessionText(
    submission: PretalxTalk,
    questions: { en: number; fr: number; es: number; ar: number },
    englishFallback: string
  ): Record<string, string | undefined> {
    const en =
      pretalx.findAnswer(questions.en, submission.answers) ?? englishFallback
    const fr = pretalx.findAnswer(questions.fr, submission.answers)
    const es = pretalx.findAnswer(questions.es, submission.answers)
    const ar = pretalx.findAnswer(questions.ar, submission.answers)

    const result: Record<string, string | undefined> = { en }

    if (fr) result.fr = fr
    if (es) result.es = es
    if (ar) result.ar = ar

    return result
  }

  function getSessionLinks(submission: PretalxTalk): LocalisedLink[] {
    const resourceLinks: LocalisedLink[] = submission.resources.map((r) => ({
      type: 'any',
      title: r.description,
      url: `https://pretalx.com${r.resource}`,
      language: 'en',
    }))
    return [
      ...pretalx.getSessionLinks(submission, config.questions.links.en),
      ...pretalx
        .getSessionLinks(submission, config.questions.links.fr)
        .map((l) => ({ ...l, language: 'fr' })),
      ...pretalx
        .getSessionLinks(submission, config.questions.links.es)
        .map((l) => ({ ...l, language: 'es' })),
      ...pretalx
        .getSessionLinks(submission, config.questions.links.ar)
        .map((l) => ({ ...l, language: 'ar' })),
      ...resourceLinks,
    ]
  }

  function getBoolean(submission: PretalxTalk, question: number) {
    return (
      pretalx.findAnswer(question, submission.answers)?.toLowerCase() === 'true'
    )
  }

  return {
    getThemes,
    getSessions,
    getSessionLanguages,
    getSessionText,
  }
}
