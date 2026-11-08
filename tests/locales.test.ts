import { describe, expect, it } from 'vitest'
import { canonicalContentLang, contentHreflang, uiLocaleForPsnLanguage } from '../shared/locales'

describe('trophy content language SEO mapping', () => {
  it('preserves API language codes in trophy URLs', () => {
    expect(canonicalContentLang('en-US')).toBe('en-US')
    expect(canonicalContentLang('es-419')).toBe('es-419')
  })

  it('maps unsupported UN M49 regions to a supported hreflang', () => {
    expect(contentHreflang('es-419')).toBe('es')
    expect(contentHreflang('fr-FR')).toBe('fr-FR')
  })

  it('rejects malformed content-language params', () => {
    expect(canonicalContentLang('../en')).toBe('')
    expect(contentHreflang('en-US-extra')).toBe('')
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
