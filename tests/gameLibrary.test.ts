import { describe, expect, it } from 'vitest'
import { COVER_LAYOUTS, coverArt, coverShapePath, formatReleaseDate, gamePlatformLabel, isPlayStationPlatform, releaseStatusLabel } from '~/utils/game'
import {
  emptyGameLibraryFilters,
  gameBrowsePath,
  gameBrowseQuery,
  gameLibraryRouteQuery,
  parseGameLibraryQuery,
} from '~/utils/gameLibrary'

describe('game browser API query', () => {
  it('sends the page size and only valid searches', () => {
    expect(gameBrowseQuery(emptyGameLibraryFilters(), 1)).toEqual({ page: 1, per_page: 36 })
    expect(gameBrowseQuery({ search: ' a ' }, 2)).toEqual({ page: 2, per_page: 36 })
    expect(gameBrowsePath(gameBrowseQuery({ search: 'ff7r' }, 1))).toBe('/games?page=1&per_page=36&q=ff7r')
  })
})

describe('game browser URL state', () => {
  it('reads the search and page, ignoring anything unrecognised', () => {
    expect(parseGameLibraryQuery({ q: ' elden ', platform: 'PS5', page: '3' })).toEqual({
      filters: { search: 'elden' },
      page: 3,
    })
    expect(parseGameLibraryQuery({ q: [null, 'p5r'], page: '0' })).toEqual({
      filters: { search: 'p5r' },
      page: 1,
    })
  })

  it('writes the state back without defaults', () => {
    expect(gameLibraryRouteQuery({ filters: emptyGameLibraryFilters(), page: 1 })).toEqual({})
    expect(gameLibraryRouteQuery({ filters: { search: 'p5r' }, page: 2 })).toEqual({ q: 'p5r', page: '2' })
  })
})

describe('game formatting', () => {
  // Outside Nuxt the helpers format in the default locale (ja-JP) and return message keys.
  it('formats release dates at their precision', () => {
    expect(formatReleaseDate('2022-02-25', 'day')).toBe('2022年2月25日')
    expect(formatReleaseDate('2026-03-01', 'month')).toBe('2026年3月')
    expect(formatReleaseDate('2026-01-01', 'year')).toBe('2026年')
    expect(formatReleaseDate('2026-07-01', 'quarter')).toBe('games.quarter')
    expect(formatReleaseDate(null, null)).toBe('games.tba')
  })

  it('keeps the calendar day whatever the visitor time zone', () => {
    // 1 January in UTC is still 31 December west of Greenwich.
    expect(formatReleaseDate('2026-01-01', 'day')).toBe('2026年1月1日')
  })

  it('labels platforms', () => {
    expect(gamePlatformLabel({ code: 'PSVITA', name: 'PlayStation Vita', abbreviation: 'Vita' })).toBe('PSV')
    expect(gamePlatformLabel({ code: 'PSVR2', name: 'PlayStation VR2', abbreviation: 'PSVR2' })).toBe('PS VR2')
    expect(gamePlatformLabel({ code: 'SWITCH', name: 'Nintendo Switch', abbreviation: 'Switch' })).toBe('Switch')
    expect(gamePlatformLabel({ code: 'META-QUEST-3', name: 'Meta Quest 3', abbreviation: null })).toBe('Meta Quest 3')
    expect(isPlayStationPlatform('PS5')).toBe(true)
    expect(isPlayStationPlatform('PC')).toBe(false)
  })

  it('draws the same cover for the same game, in one colour family', () => {
    expect(coverArt(7)).toEqual(coverArt('7'))
    for (let id = 1; id <= 200; id++) {
      const art = coverArt(id)
      expect(new Set([art.bg, art.shape, art.accent, art.band, art.text]).size).toBe(5)
      expect(art.sprinkles.length).toBeGreaterThanOrEqual(2)
      expect(art.sprinkles.every(item => item.shape !== art.big)).toBe(true)
    }
    expect(new Set(Array.from({ length: 60 }, (_, id) => coverArt(id).bg)).size).toBe(8)
    expect(new Set(Array.from({ length: 60 }, (_, id) => coverArt(id).layout))).toEqual(new Set(COVER_LAYOUTS))
  })

  it('draws the face-button symbols as paths', () => {
    expect(coverShapePath('square', 50, 50, 10)).toBe('M42 42h16v16h-16Z')
    expect(coverShapePath('cross', 50, 50, 10)).toBe('M43 43L57 57M57 43L43 57')
  })

  it('shows unknown release statuses as words', () => {
    expect(releaseStatusLabel('early_access')).toBe('games.status.early_access')
    expect(releaseStatusLabel('soft_launch')).toBe('Soft launch')
  })
})
