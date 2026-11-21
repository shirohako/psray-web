import { describe, expect, it } from 'vitest'
import type { SeriesEntry, SeriesEntryProgress, SeriesStage } from '~/services/series'
import {
  entryProgressMap,
  mainStages,
  orderStageEntries,
  parseSeriesLibraryQuery,
  seriesBrowsePath,
  seriesCardUrl,
  seriesLibraryRouteQuery,
  seriesPercent,
  seriesYears,
  sideStages,
  stageStateMap,
  visibleEntryCount,
} from '~/utils/series'
import { parseProfileQuery, profileRouteQuery } from '~/utils/profileQuery'

const entry = (id: number): SeriesEntry => ({
  id,
  np_communication_id: `NPWR${id}`,
  name: `Set ${id}`,
  localized_name: `Set ${id}`,
  display_language: 'en-US',
  default_language: 'en-US',
  platform: ['PS4'],
  icon_url: '',
  defined_trophies: { platinum: 1, gold: 1, silver: 1, bronze: 1 },
  owners: 100 - id,
  completed_players: 0,
  platinum_rate: null,
  completion_rate: null,
  region: null,
  game_id: null,
})

const played = (id: number, progress: number): SeriesEntryProgress => ({
  trophy_set_id: id,
  progress,
  earned_platinum: progress === 100 ? 1 : 0,
  earned_gold: 0,
  earned_silver: 0,
  earned_bronze: 0,
  last_earned_at: null,
})

describe('series browser query', () => {
  it('omits defaults and round-trips search, sort and page', () => {
    expect(seriesLibraryRouteQuery({ search: '', sort: 'popular', page: 1 })).toEqual({})
    const state = { search: 'trails', sort: 'recent', page: 3 } as const
    expect(seriesLibraryRouteQuery(state)).toEqual({ q: 'trails', sort: 'recent', page: '3' })
    expect(parseSeriesLibraryQuery(seriesLibraryRouteQuery(state))).toEqual(state)
  })

  it('falls back to defaults for unknown values', () => {
    expect(parseSeriesLibraryQuery({ sort: 'oldest', page: '-1', q: ['  ys  '] })).toEqual({ search: 'ys', sort: 'popular', page: 1 })
  })

  it('builds the API path and drops searches the API would reject', () => {
    expect(seriesBrowsePath({ search: 'trails', sort: 'name', page: 2 })).toBe('/series?page=2&per_page=24&sort=name&q=trails')
    expect(seriesBrowsePath({ search: 'y', sort: 'popular', page: 1 })).toBe('/series?page=1&per_page=24&sort=popular')
  })
})

describe('series helpers', () => {
  it('formats the year range', () => {
    expect(seriesYears({ first_year: 2004, last_year: 2024 })).toBe('2004–2024')
    expect(seriesYears({ first_year: 2010, last_year: 2010 })).toBe('2010')
    expect(seriesYears({ first_year: null, last_year: 2012 })).toBe('2012')
    expect(seriesYears({ first_year: null, last_year: null })).toBe('')
  })

  it('splits main and side stages and computes the cleared share', () => {
    const stages = [{ id: 1, kind: 'main' }, { id: 2, kind: 'side' }, { id: 3, kind: 'main' }] as SeriesStage[]
    expect(mainStages(stages).map(stage => stage.id)).toEqual([1, 3])
    expect(sideStages(stages).map(stage => stage.id)).toEqual([2])
    expect(seriesPercent(4, 7)).toBe(57)
    expect(seriesPercent(0, 0)).toBe(0)
  })

  it('maps the viewer payload by id and tolerates guests and private profiles', () => {
    expect(entryProgressMap(null).size).toBe(0)
    expect(entryProgressMap({ psnid: 'x', found: true, is_public: false, avatar_url: null }).size).toBe(0)
    const viewer = { psnid: 'x', found: true, is_public: true, avatar_url: null, entries: [played(5, 80)], stages: [{ id: 9, state: 'started' as const, best: 80 }] }
    expect(entryProgressMap(viewer).get(5)?.progress).toBe(80)
    expect(stageStateMap(viewer).get(9)).toEqual({ state: 'started', best: 80 })
  })
})

describe('stage entries', () => {
  const entries = [entry(1), entry(2), entry(3), entry(4), entry(5)]

  it('keeps the admin order for guests and shows three', () => {
    expect(orderStageEntries(entries, new Map()).map(e => e.id)).toEqual([1, 2, 3, 4, 5])
    expect(visibleEntryCount(entries, new Map())).toBe(3)
    expect(visibleEntryCount(entries.slice(0, 2), new Map())).toBe(2)
  })

  it('puts what the player played first, furthest along first, and shows all of it', () => {
    const progress = new Map([[4, played(4, 40)], [2, played(2, 100)], [5, played(5, 40)]])
    expect(orderStageEntries(entries, progress).map(e => e.id)).toEqual([2, 4, 5, 1, 3])
    expect(visibleEntryCount(entries, progress)).toBe(3)
    expect(visibleEntryCount(entries, new Map([[3, played(3, 10)]]))).toBe(2)
  })
})

describe('profile series tab', () => {
  it('is a tab of its own that keeps its page in the URL', () => {
    expect(parseProfileQuery({ tab: 'series', page: '2' })).toEqual({ tab: 'series', page: 2, q: '' })
    expect(profileRouteQuery({ tab: 'series', page: 2, q: '' })).toEqual({ tab: 'series', page: '2' })
  })
})

describe('seriesCardUrl', () => {
  it('points at the versioned card in the asked format', () => {
    expect(seriesCardUrl('https://api.psray.net/', { id: 52, card: '5e87062fc1d9' }, 'webp'))
      .toBe('https://api.psray.net/card/series/52.webp?v=5e87062fc1d9')
    expect(seriesCardUrl('https://api.psray.net', { id: 52, card: '5e87062fc1d9' }, 'jpg'))
      .toBe('https://api.psray.net/card/series/52.jpg?v=5e87062fc1d9')
  })

  it('has nothing to point at before a card exists', () => {
    expect(seriesCardUrl('https://api.psray.net', { id: 52, card: null }, 'jpg')).toBeNull()
  })
})
