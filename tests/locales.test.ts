import { describe, expect, it } from 'vitest'
import { canonicalContentLang, contentEditions, profileEditions, uiLocaleForPsnLanguage } from '../shared/locales'

describe('trophy content language params', () => {
  it('preserves API language codes', () => {
    expect(canonicalContentLang('en-US')).toBe('en-US')
    expect(canonicalContentLang('es-419')).toBe('es-419')
  })

  it('rejects malformed values', () => {
    expect(canonicalContentLang('../en')).toBe('')
    expect(canonicalContentLang('en-US-extra')).toBe('')
  })
})

describe('PSN language → UI locale', () => {
  it('folds regional and script spellings onto the five interfaces', () => {
    expect(uiLocaleForPsnLanguage('ja-JP')).toBe('ja')
    expect(uiLocaleForPsnLanguage('en-GB')).toBe('en')
    expect(uiLocaleForPsnLanguage('en')).toBe('en')
    expect(uiLocaleForPsnLanguage('ko-kr')).toBe('ko')
    expect(uiLocaleForPsnLanguage('zh-Hant')).toBe('zh-Hant')
    expect(uiLocaleForPsnLanguage('zh-TW')).toBe('zh-Hant')
    expect(uiLocaleForPsnLanguage('zh-HK')).toBe('zh-Hant')
    expect(uiLocaleForPsnLanguage('zh-Hans')).toBe('zh-Hans')
    expect(uiLocaleForPsnLanguage('zh-CN')).toBe('zh-Hans')
  })

  it('has no interface for other PSN languages or junk', () => {
    expect(uiLocaleForPsnLanguage('fr-FR')).toBe('')
    expect(uiLocaleForPsnLanguage('es-419')).toBe('')
    expect(uiLocaleForPsnLanguage('zh')).toBe('')
    expect(uiLocaleForPsnLanguage('金色')).toBe('')
    expect(uiLocaleForPsnLanguage(undefined)).toBe('')
  })
})

// The backend sitemap applies the same rules (SitemapLanguages); keep the vectors in step.
describe('editions', () => {
  it('indexes content in Japanese and English, plus Chinese and Korean only where it exists', () => {
    expect(contentEditions(['en-US', 'fr-FR'])).toEqual(['ja', 'en'])
    expect(contentEditions(['ja-JP', 'en-US', 'zh-Hant', 'ko-KR'])).toEqual(['ja', 'zh-Hant', 'en', 'ko'])
    expect(contentEditions(['zh-Hans', 'zh-Hant', 'en-GB'])).toEqual(['ja', 'zh-Hans', 'zh-Hant', 'en'])
  })

  it('falls back to the default language when a set lists none', () => {
    expect(contentEditions([], 'zh-Hans')).toEqual(['ja', 'zh-Hans', 'en'])
    expect(contentEditions([], null)).toEqual(['ja', 'en'])
    expect(contentEditions([])).toEqual(['ja', 'en'])
  })

  it('adds the interfaces of a player\'s own PSN languages', () => {
    expect(profileEditions(['ja'])).toEqual(['ja', 'en'])
    expect(profileEditions(['zh-CN', 'zh-TW', 'en'])).toEqual(['ja', 'zh-Hans', 'zh-Hant', 'en'])
    expect(profileEditions(['ko-KR', 'de'])).toEqual(['ja', 'en', 'ko'])
    expect(profileEditions(null)).toEqual(['ja', 'en'])
    expect(profileEditions('zh-TW')).toEqual(['ja', 'en'])
  })
})
