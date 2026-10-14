import { describe, expect, it } from 'vitest'
import { formatReleaseDate, gamePlatformLabel, isPlayStationPlatform, releaseStatusLabel } from '~/utils/game'
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
    expect(gameBrowseQuery({ search: ' a ', platforms: [] }, 2)).toEqual({ page: 2, per_page: 36 })
    expect(gameBrowseQuery({ search: 'ff7r', platforms: [] }, 1).q).toBe('ff7r')
  })

  it('submits platforms as an array', () => {
    const query = gameBrowseQuery({ search: '', platforms: ['PS5', 'PSVR2'] }, 1)
    expect(query['platform[]']).toEqual(['PS5', 'PSVR2'])
    expect(gameBrowsePath(query)).toBe('/games?page=1&per_page=36&platform%5B%5D=PS5&platform%5B%5D=PSVR2')
  })
})

describe('game browser URL state', () => {
  it('reads filters and page, ignoring anything unrecognised', () => {
    expect(parseGameLibraryQuery({ q: ' elden ', platform: 'PS4,PC,PS5', page: '3' })).toEqual({
      filters: { search: 'elden', platforms: ['PS5', 'PS4'] },
      page: 3,
    })
    expect(parseGameLibraryQuery({ platform: ['PSVITA', 'PSVR'], page: '0' })).toEqual({
      filters: { search: '', platforms: ['PSVITA', 'PSVR'] },
      page: 1,
    })
  })

  it('writes the state back without defaults', () => {
    expect(gameLibraryRouteQuery({ filters: emptyGameLibraryFilters(), page: 1 })).toEqual({})
    expect(gameLibraryRouteQuery({ filters: { search: 'p5r', platforms: ['PS4', 'PS5'] }, page: 2 }))
      .toEqual({ q: 'p5r', platform: 'PS5,PS4', page: '2' })
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

  it('shows unknown release statuses as words', () => {
    expect(releaseStatusLabel('early_access')).toBe('games.status.early_access')
    expect(releaseStatusLabel('soft_launch')).toBe('Soft launch')
  })
})
