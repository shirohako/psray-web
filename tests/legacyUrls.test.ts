import { describe, expect, it } from 'vitest'
import { isLegacyCandidate, legacyRedirect, trailingSlashRedirect, trophyAnchorUrl } from '#shared/legacyUrls'

const to = (location: string) => ({ kind: 'location', location })

describe('legacy trophy-set URLs', () => {
  it('maps the language segment onto the interface it belongs to and drops the slug', () => {
    expect(legacyRedirect(
      '/trophies/36026/ja-JP/%E9%87%91%E8%89%B2%E3%81%AE%E9%99%BD%E3%81%A0%E3%81%BE%E3%82%8A%E3%81%A8%E5%90%9B%E3%81%AE%E9%9A%A3-Trophy-Set',
      '',
    )).toEqual(to('/trophies/36026'))
    expect(legacyRedirect('/trophies/1/en-US', '')).toEqual(to('/trophies/1?lang=en'))
    expect(legacyRedirect('/trophies/28335/zh-Hant/x', '')).toEqual(to('/trophies/28335?lang=zh-Hant'))
    expect(legacyRedirect('/trophies/34815/zh-Hans/x', '')).toEqual(to('/trophies/34815?lang=zh-Hans'))
    expect(legacyRedirect('/trophies/2/ko-KR/x', '')).toEqual(to('/trophies/2?lang=ko'))
  })

  it('sends languages without an interface to the English edition', () => {
    expect(legacyRedirect('/trophies/1/it-IT/Trofei', '')).toEqual(to('/trophies/1?lang=en'))
    expect(legacyRedirect('/trophies/1/es-419/x', '')).toEqual(to('/trophies/1?lang=en'))
  })

  it('drops psnid and every other old parameter', () => {
    expect(legacyRedirect('/trophies/1/fr-FR/x', '?psnid=foo')).toEqual(to('/trophies/1?lang=en'))
    expect(legacyRedirect('/trophies/1/ja-JP/x', '?psnid=foo&tlang=de-DE')).toEqual(to('/trophies/1'))
  })

  it('falls back to the old ?language= when the segment is only a slug', () => {
    expect(legacyRedirect('/trophies/10638/%E5%B9%BB%E8%B5%B0', '?language=zh-Hant')).toEqual(to('/trophies/10638?lang=zh-Hant'))
    expect(legacyRedirect('/trophies/10610/CAN-ANDROIDS-PRAY%3A-BLUE', '?language=en')).toEqual(to('/trophies/10610?lang=en'))
    expect(legacyRedirect('/trophies/1/GODZILLA', '')).toEqual(to('/trophies/1'))
  })

  it('still opens the set when the segment is unusable', () => {
    expect(legacyRedirect('/trophies/1/%E9%87%91/x', '')).toEqual(to('/trophies/1'))
    expect(legacyRedirect('/trophies/1/%E0%A4%A/x', '')).toEqual(to('/trophies/1'))
  })

  it('folds the old ?language= on the set page itself', () => {
    expect(legacyRedirect('/trophies/1005', '?language=fr-FR&psnid=Chan_Paul56')).toEqual(to('/trophies/1005?lang=en'))
    expect(legacyRedirect('/trophies/2', '?language=ko-kr')).toEqual(to('/trophies/2?lang=ko'))
    expect(legacyRedirect('/trophies/2', '?language=ja-JP')).toEqual(to('/trophies/2'))
  })

  it('leaves current trophy URLs alone', () => {
    expect(legacyRedirect('/trophies/1', '')).toBeNull()
    expect(legacyRedirect('/trophies/1', '?tlang=fr-FR&psnid=foo')).toBeNull()
    expect(legacyRedirect('/trophies', '')).toBeNull()
    expect(legacyRedirect('/trophies/abc/ja-JP/x', '')).toBeNull()
  })
})

describe('other old-site URLs', () => {
  it('sends rankings and laboratory pages to their set', () => {
    expect(legacyRedirect('/trophies/ranking/time-attack', '?trophies=2522')).toEqual(to('/trophies/2522'))
    expect(legacyRedirect('/trophies/ranking/recent', '?trophies=7&page=3')).toEqual(to('/trophies/7'))
    expect(legacyRedirect('/trophies/ranking/pioneers', '?trophies=x')).toBeNull()
    expect(legacyRedirect('/laboratory/contributions/trophies/123', '')).toEqual(to('/trophies/123'))
    expect(legacyRedirect('/laboratory/contributions/trophies/region', '?id=123')).toEqual(to('/trophies/123'))
    expect(legacyRedirect('/laboratory/contributions/trophies/playthroughs', '?id=5')).toEqual(to('/trophies/5'))
    expect(legacyRedirect('/laboratory/contributions/trophies/relation', '')).toBeNull()
    expect(legacyRedirect('/laboratory/wiki/changes', '?resource=1')).toBeNull()
  })

  it('asks for a lookup for single-trophy URLs', () => {
    expect(legacyRedirect('/trophy/636711', '')).toEqual({ kind: 'trophy', trophyId: 636711 })
    expect(legacyRedirect('/trophy/achievers', '?id=267312')).toEqual({ kind: 'trophy', trophyId: 267312 })
    expect(legacyRedirect('/trophy/achievers', '?id=abc')).toBeNull()
    expect(trophyAnchorUrl(23082, 636711)).toBe('/trophies/23082#trophy-636711')
  })

  it('only parses paths that can be legacy', () => {
    expect(isLegacyCandidate('/trophy/1')).toBe(true)
    expect(isLegacyCandidate('/laboratory/contributions/trophies/1')).toBe(true)
    expect(isLegacyCandidate('/p/abyssmoe')).toBe(false)
    expect(isLegacyCandidate('/trophies')).toBe(false)
  })
})

describe('trailing slashes', () => {
  it('strips them from page paths and keeps the query', () => {
    expect(trailingSlashRedirect('/trophies/1/', '?lang=en')).toBe('/trophies/1?lang=en')
    expect(trailingSlashRedirect('/games//', '')).toBe('/games')
  })

  it('leaves the root, clean paths and Nuxt internals alone', () => {
    expect(trailingSlashRedirect('/', '')).toBeNull()
    expect(trailingSlashRedirect('/trophies/1', '')).toBeNull()
    expect(trailingSlashRedirect('/_nuxt/', '')).toBeNull()
  })
})
