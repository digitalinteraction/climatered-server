import fse = require('fs-extra')
import path = require('path')
import Yaml = require('yaml')
import dot = require('dot-prop')
import mustache = require('mustache')

export type Locale = 'en' | 'fr' | 'es' | 'ar'

export interface I18nService {
  translate(country: Locale, key: string, variables?: any): string
}

async function readYaml(country: string) {
  const data = await fse.readFile(
    path.join(__dirname, `../i18n/${country}.yml`),
    'utf8'
  )

  return Yaml.parse(data)
}

export async function loadLocales() {
  const [en, fr, es, ar] = await Promise.all([
    readYaml('en'),
    readYaml('fr'),
    readYaml('es'),
    readYaml('ar'),
  ])

  return { en, fr, es, ar }
}

export function getKeys(object: any, segments: string[] = []) {
  const keys: string[] = []

  for (const [key, value] of Object.entries(object)) {
    const newSegments = segments.concat([key])

    if (typeof value === 'object') {
      keys.push(...getKeys(value, newSegments))
    } else {
      keys.push(newSegments.join('.'))
    }
  }

  return keys
}

export function assertLocales(locales: Record<Locale, any>, throws: boolean) {
  const requiredKeys = getKeys(locales.en)
  const frKeys = new Set(getKeys(locales.fr))
  const esKeys = new Set(getKeys(locales.es))
  const arKeys = new Set(getKeys(locales.ar))

  const missingFr = requiredKeys.filter((k) => !frKeys.has(k))
  const missingEs = requiredKeys.filter((k) => !esKeys.has(k))
  const missingAr = requiredKeys.filter((k) => !arKeys.has(k))

  const errorOrWarn = (msg: string) => {
    if (throws) throw new Error(msg)
    else console.log('WARNING: ' + msg)
  }

  const joiner = '\n - '

  if (missingFr.length > 0) {
    errorOrWarn('missing french keys:' + joiner + missingFr.join(joiner))
  }

  if (missingEs.length > 0) {
    errorOrWarn('missing spanish keys:' + joiner + missingEs.join(joiner))
  }

  if (missingAr.length > 0) {
    errorOrWarn('missing arabic keys:' + joiner + missingAr.join(joiner))
  }
}

export async function createI18nService(): Promise<I18nService> {
  const locales = await loadLocales()

  // Ensure all locales all have the same keys
  assertLocales(locales, false)

  const data: Record<Locale, any> = locales

  return {
    translate(country, key, values) {
      const tpl: string | undefined =
        dot.get(data[country], key) ?? dot.get(data.en, key)

      if (!tpl) {
        throw new Error(`Unknown translation key "${key}"`)
      }

      return mustache.render(tpl, values)
    },
  }
}
