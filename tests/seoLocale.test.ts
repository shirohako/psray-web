import { describe, expect, it } from 'vitest'
import { resolveSeoEditions } from '../app/utils/seoLocale'

describe('SEO editions policy', () => {
  it('uses one bare edition and no alternates for fixed Japanese pages', () => {
    expect(resolveSeoEditions({ staticLocale: 'ja', active: 'en', noindex: false })).toEqual({
      indexable: true,
      canonicalLocale: 'ja',
      alternates: [],
      xDefault: 'ja',
      ogLocale: 'ja_JP',
      ogAlternates: [],
    })
  })

  it('lists every edition and points x-default at English', () => {
    expect(resolveSeoEditions({ active: 'ko', noindex: false })).toEqual({
      indexable: true,
      canonicalLocale: 'ko',
      alternates: ['ja', 'zh-Hans', 'zh-Hant', 'en', 'ko'],
      xDefault: 'en',
      ogLocale: 'ko_KR',
      ogAlternates: ['ja_JP', 'zh_CN', 'zh_TW', 'en_US'],
    })
  })

  it('keeps a page to its editions, in UI order', () => {
    const policy = resolveSeoEditions({ active: 'en', editions: ['en', 'ja', 'zh-Hant'], noindex: false })
    expect(policy.indexable).toBe(true)
    expect(policy.alternates).toEqual(['ja', 'zh-Hant', 'en'])
  })

  it('makes a locale outside the editions, or noindex, a personal view', () => {
    const outside = resolveSeoEditions({ active: 'ko', editions: ['ja', 'en'], noindex: false })
    expect(outside.indexable).toBe(false)
    expect(outside.alternates).toEqual([])
    expect(resolveSeoEditions({ active: 'en', noindex: true }).indexable).toBe(false)
  })
})
