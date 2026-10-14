import type { GameBrowseQuery } from '~/services/games'
import { TROPHY_SEARCH_MIN_LENGTH } from '~/utils/trophyLibrary'

/** Divides evenly into the 2 / 3 / 4 / 6 column cover grid, so every page ends on a full row. */
export const GAME_PAGE_SIZE = 36

export interface GameLibraryFilters {
  search: string
}

export interface GameLibraryState {
  filters: GameLibraryFilters
  page: number
}

export const emptyGameLibraryFilters = (): GameLibraryFilters => ({ search: '' })

/** Convert the page state into the public API's parameter names and values. */
export function gameBrowseQuery(filters: GameLibraryFilters, page: number, perPage = GAME_PAGE_SIZE): GameBrowseQuery {
  const query: GameBrowseQuery = { page, per_page: perPage }
  const search = filters.search.trim().slice(0, 100)
  if (search.length >= TROPHY_SEARCH_MIN_LENGTH) query.q = search
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

const first = (value: RouteQueryValue) =>
  (Array.isArray(value) ? value : [value]).find((item): item is string => typeof item === 'string') ?? ''

/** Read the page state from the route query, ignoring anything unrecognised. */
export function parseGameLibraryQuery(query: Record<string, RouteQueryValue>): GameLibraryState {
  const page = Number.parseInt(first(query.page), 10)
  return {
    filters: { search: first(query.q).trim().slice(0, 100) },
    page: Number.isFinite(page) && page > 1 ? page : 1,
  }
}

/** Inverse of `parseGameLibraryQuery`; defaults are left out to keep URLs short. */
export function gameLibraryRouteQuery({ filters, page }: GameLibraryState): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.search) query.q = filters.search
  if (page > 1) query.page = String(page)
  return query
}
