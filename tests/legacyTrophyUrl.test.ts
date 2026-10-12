import { describe, expect, it } from 'vitest'
import { legacyTrophyRedirect } from '#shared/legacyTrophyUrl'

describe('legacy trophy URLs', () => {
  it('folds the language segment into ?tlang= and drops the slug', () => {
    expect(legacyTrophyRedirect(
      '/trophies/36026/ja-JP/%E9%87%91%E8%89%B2%E3%81%AE%E9%99%BD%E3%81%A0%E3%81%BE%E3%82%8A%E3%81%A8%E5%90%9B%E3%81%AE%E9%9A%A3-Trophy-Set',
      '',
    )).toBe('/trophies/36026?tlang=ja-JP')
    expect(legacyTrophyRedirect('/trophies/1/en-US', '')).toBe('/trophies/1?tlang=en-US')
  })

  it('keeps the existing query, and an explicit ?tlang= wins', () => {
    expect(legacyTrophyRedirect('/trophies/1/fr-FR/x', '?psnid=foo'))
      .toBe('/trophies/1?psnid=foo&tlang=fr-FR')
    expect(legacyTrophyRedirect('/trophies/1/fr-FR/x', '?tlang=de-DE'))
      .toBe('/trophies/1?tlang=de-DE')
  })

  it('still opens the set when the language segment is unusable', () => {
    expect(legacyTrophyRedirect('/trophies/1/%E9%87%91/x', '')).toBe('/trophies/1')
    expect(legacyTrophyRedirect('/trophies/1/%E0%A4%A/x', '')).toBe('/trophies/1')
  })

  it('leaves current trophy paths alone', () => {
    expect(legacyTrophyRedirect('/trophies/1', '')).toBeNull()
    expect(legacyTrophyRedirect('/trophies', '')).toBeNull()
    expect(legacyTrophyRedirect('/trophies/abc/ja-JP/x', '')).toBeNull()
  })
})
