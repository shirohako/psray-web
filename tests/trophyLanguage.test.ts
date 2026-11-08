import { describe, expect, it } from 'vitest'
import { pickTrophyLanguage, tlangRedirect, withTrophyLanguage, type TrophyLanguageState } from '#shared/trophyLanguage'

// Vectors from psray-api tests/Unit/TranslationResolverTest.php: the page has to
// predict exactly what the API will serve.
describe('pickTrophyLanguage mirrors TranslationResolver::pick', () => {
  it('prefers an exact match, then a variant of the same language', () => {
    expect(pickTrophyLanguage(['en-US', 'zh-Hans', 'zh-Hant'], ['zh-Hant'], 'en-US')).toBe('zh-Hant')
    expect(pickTrophyLanguage(['en-US', 'zh-Hans'], ['zh-Hant'], 'en-US')).toBe('zh-Hans')
    expect(pickTrophyLanguage(['zh-Hans', 'en-US'], ['zh-Hant', 'en-US'], null)).toBe('zh-Hans')
  })

  it('walks the preference list in order, then falls back to the default', () => {
    expect(pickTrophyLanguage(['ja-JP', 'en-US'], ['fr-FR', 'en-US'], 'ja-JP')).toBe('en-US')
    expect(pickTrophyLanguage(['en-US', 'ja-JP'], ['fr-FR'], 'en-US')).toBe('en-US')
    expect(pickTrophyLanguage(['en-US', 'ja-JP'], [], 'en-US')).toBe('en-US')
    expect(pickTrophyLanguage([], ['zh-Hant'], 'en-US')).toBe('en-US')
    expect(pickTrophyLanguage(['de-DE', 'fr-FR'], ['ja-JP'], 'en-US')).toBe('de-DE')
  })
})

describe('withTrophyLanguage', () => {
  it('spells the interface out beside an override, lang=ja included', () => {
    expect(withTrophyLanguage({ psnid: 'x', tlang: 'de-DE' }, 'ja', 'fr-FR')).toEqual({ psnid: 'x', lang: 'ja', tlang: 'fr-FR' })
    expect(withTrophyLanguage({ lang: 'zh-Hans' }, 'zh-Hans', 'en-US')).toEqual({ lang: 'zh-Hans', tlang: 'en-US' })
  })

  it('drops the override, and lang=ja with it', () => {
    expect(withTrophyLanguage({ lang: 'ja', tlang: 'fr-FR' }, 'ja', null)).toEqual({})
    expect(withTrophyLanguage({ lang: 'en', tlang: 'fr-FR', psnid: 'x' }, 'en', null)).toEqual({ psnid: 'x', lang: 'en' })
  })
})

describe('?tlang= redirects (docs/seo.md URL table)', () => {
  // A set with Japanese, English, Simplified Chinese and French text.
  const set = (served: string, preferenceEnabled = false): TrophyLanguageState => ({
    available: ['en-US', 'ja-JP', 'zh-Hans', 'fr-FR'],
    defaultLanguage: 'en-US',
    served,
    preferenceEnabled,
  })

  it('leaves URLs without tlang alone', () => {
    expect(tlangRedirect({}, set('ja-JP'))).toBeNull()
    expect(tlangRedirect({ lang: 'en' }, set('en-US'))).toBeNull()
  })

  it('drops a tlang that changes nothing', () => {
    expect(tlangRedirect({ lang: 'en', tlang: 'en-US' }, set('en-US'))).toEqual({ lang: 'en' })
    expect(tlangRedirect({ lang: 'ja', tlang: 'ja-JP' }, set('ja-JP'))).toEqual({})
    expect(tlangRedirect({ lang: 'zh-Hans', tlang: 'zh-Hans', psnid: 'x' }, set('zh-Hans'))).toEqual({ psnid: 'x', lang: 'zh-Hans' })
  })

  it('moves old links (tlang, no lang) to their language\'s own interface', () => {
    expect(tlangRedirect({ tlang: 'en-US' }, set('en-US'))).toEqual({ lang: 'en' })
    expect(tlangRedirect({ tlang: 'ja-JP' }, set('ja-JP'))).toEqual({})
    expect(tlangRedirect({ tlang: 'zh-Hans' }, set('zh-Hans'))).toEqual({ lang: 'zh-Hans' })
  })

  it('keeps real overrides: rendered, noindex', () => {
    expect(tlangRedirect({ lang: 'en', tlang: 'fr-FR' }, set('fr-FR'))).toBeNull()
    expect(tlangRedirect({ tlang: 'fr-FR' }, set('fr-FR'))).toBeNull()
    expect(tlangRedirect({ lang: 'ja', tlang: 'en-US' }, set('en-US'))).toBeNull()
    expect(tlangRedirect({ lang: 'zh-Hans', tlang: 'ja-JP' }, set('ja-JP'))).toBeNull()
  })

  it('drops an override the set has no text for', () => {
    // Korean asked for, Japanese served: the same as the bare Japanese page.
    expect(tlangRedirect({ lang: 'ja', tlang: 'ko-KR' }, set('ja-JP'))).toEqual({})
    // An old ?tlang=de-DE on a set without German shows the Japanese page too.
    expect(tlangRedirect({ tlang: 'de-DE' }, set('ja-JP'))).toEqual({})
  })

  it('drops malformed values', () => {
    expect(tlangRedirect({ tlang: '../x', lang: 'ja' }, set('ja-JP'))).toEqual({})
    expect(tlangRedirect({ tlang: '', lang: 'ko' }, set('ja-JP'))).toEqual({ lang: 'ko' })
  })

  it('never redirects a reader with a trophy-language preference', () => {
    expect(tlangRedirect({ lang: 'en', tlang: 'en-US' }, set('en-US', true))).toBeNull()
    expect(tlangRedirect({ tlang: 'en-US' }, set('en-US', true))).toBeNull()
  })
})
