import {
  createI18nService,
  assertLocales,
  loadLocales,
  I18nService,
  getKeys,
} from '../i18n'

describe('#assertLocales', () => {
  it('should throw if a key is missing', () => {
    const locales = {
      en: { key: 'value' },
      fr: { key: 'value' },
      es: { key: 'value' },
      ar: {},
    }

    const exec = () => assertLocales(locales, true)

    expect(exec).toThrow(/key/)
  })
})

describe('#getKeys', () => {
  it('should return an array of all nested keys', () => {
    const keys = getKeys({
      timestamp: '001',
      geoff: {
        name: 'Geoff',
        age: 42,
      },
    })

    expect(keys).toContain('timestamp')
    expect(keys).toContain('geoff.name')
    expect(keys).toContain('geoff.age')
  })
})

describe('#loadLocales', () => {
  it('should load the locale files', async () => {
    const locales = await loadLocales()

    expect(locales.en.test.simple).toEqual('Hello, world!')
    expect(locales.fr.test.simple).toEqual('Bonjour le monde!')
    expect(locales.es.test.simple).toEqual('¡Hola Mundo!')
    expect(locales.ar.test.simple).toEqual('مرحبا بالعالم!')
  })
})

describe('createI18nService', () => {
  let service: I18nService

  beforeEach(async () => {
    service = await createI18nService()
  })

  describe('#translate', () => {
    it('should perform simple translations', () => {
      const result = service.translate('en', 'test.simple')
      expect(result).toEqual('Hello, world!')
    })

    it('should perform simple french translations', () => {
      const result = service.translate('fr', 'test.simple')
      expect(result).toEqual('Bonjour le monde!')
    })

    it('should perform simple spanish translations', () => {
      const result = service.translate('es', 'test.simple')
      expect(result).toEqual('¡Hola Mundo!')
    })

    it('should perform simple arabic translations', () => {
      const result = service.translate('ar', 'test.simple')
      expect(result).toEqual('مرحبا بالعالم!')
    })

    it('should perform substitutions', () => {
      const result = service.translate('en', 'test.substituted', {
        name: 'Geoff',
      })

      expect(result).toEqual('Hello, Geoff!')
    })
  })
})

describe('live locales', () => {
  it('should be valid', async () => {
    const locales = await loadLocales()

    const exec = () => assertLocales(locales, true)

    expect(exec).not.toThrow()
  })
})
