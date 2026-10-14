import type { GameBrowseQuery } from '~/services/games'
import { TROPHY_SEARCH_MIN_LENGTH } from '~/utils/trophyLibrary'

/** Platforms offered as filters on the game browser. The API accepts any platform code. */
export const GAME_FILTER_PLATFORMS = ['PS5', 'PS4', 'PS3', 'PSVITA', 'PSVR2', 'PSVR'] as const

/** Divides evenly into the 2 / 3 / 4 / 6 column cover grid, so every page ends on a full row. */
export const GAME_PAGE_SIZE = 36

export interface GameLibraryFilters {
  search: string
  platforms: string[]
}

export interface GameLibraryState {
  filters: GameLibraryFilters
  page: number
}

export const emptyGameLibraryFilters = (): GameLibraryFilters => ({ search: '', platforms: [] })

/** Convert the page state into the public API's parameter names and values. */
export function gameBrowseQuery(filters: GameLibraryFilters, page: number, perPage = GAME_PAGE_SIZE): GameBrowseQuery {
  const query: GameBrowseQuery = { page, per_page: perPage }
  const search = filters.search.trim().slice(0, 100)
  if (search.length >= TROPHY_SEARCH_MIN_LENGTH) query.q = search
  if (filters.platforms.length) query['platform[]'] = [...filters.platforms]
  return query
}

/** Stable request path; using it as the reactive fetch URL guarantees refetches. */
export function gameBrowsePath(query: GameBrowseQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item)
    }
    else {
      params.set(key, String(value))
    }
  }
  return `/games?${params.toString()}`
}

type RouteQueryValue = string | null | (string | null)[] | undefined

const values = (value: RouteQueryValue) =>
  (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string')
const first = (value: RouteQueryValue) => values(value)[0] ?? ''

/** Read the page state from the route query, ignoring anything unrecognised. */
export function parseGameLibraryQuery(query: Record<string, RouteQueryValue>): GameLibraryState {
  const page = Number.parseInt(first(query.page), 10)
  // `platform=PS5,PS4`, with repeated `platform=` keys still accepted.
  const platforms = values(query.platform).flatMap(value => value.split(','))
  return {
    filters: {
      search: first(query.q).trim().slice(0, 100),
      platforms: GAME_FILTER_PLATFORMS.filter(platform => platforms.includes(platform)),
    },
    page: Number.isFinite(page) && page > 1 ? page : 1,
  }
}

/** Inverse of `parseGameLibraryQuery`; defaults are left out to keep URLs short. */
export function gameLibraryRouteQuery({ filters, page }: GameLibraryState): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.search) query.q = filters.search
  if (filters.platforms.length) query.platform = GAME_FILTER_PLATFORMS.filter(platform => filters.platforms.includes(platform)).join(',')
  if (page > 1) query.page = String(page)
  return query
}
