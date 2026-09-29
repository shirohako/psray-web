import type { TrophyBrowseQuery, TrophyBrowseSort } from '~/services/trophies'

export type LibraryCategory = 'new' | 'trending' | 'popular'
export type PlatinumFilter = 'all' | 'yes' | 'no'
export type PlatinumRateFilter = 'all' | 'under5' | 'from5' | 'from15' | 'from30' | 'from50'
export type OwnersFilter = 'all' | 'under100' | 'from100' | 'from1000' | 'from10000'

export const TROPHY_SEARCH_MIN_LENGTH = 2

export interface LibraryFilters {
  search: string
  platforms: string[]
  platinum: PlatinumFilter
  owners: OwnersFilter
  rate: PlatinumRateFilter
}

export const emptyLibraryFilters = (): LibraryFilters => ({
  search: '',
  platforms: [],
  platinum: 'all',
  owners: 'all',
  rate: 'all',
})

const SORTS: Record<LibraryCategory, TrophyBrowseSort> = {
  new: 'newest',
  trending: 'trending',
  popular: 'popular',
}

// API bounds are inclusive. Trophy rates are returned to one decimal place, so
// 4.9 / 14.9 / 29.9 / 49.9 keep the five UI bands non-overlapping.
const RATE_RANGES: Record<Exclude<PlatinumRateFilter, 'all'>, [number?, number?]> = {
  under5: [undefined, 4.9],
  from5: [5, 14.9],
  from15: [15, 29.9],
  from30: [30, 49.9],
  from50: [50, undefined],
}

const OWNER_RANGES: Record<Exclude<OwnersFilter, 'all'>, [number?, number?]> = {
  under100: [undefined, 99],
  from100: [100, 999],
  from1000: [1000, 9999],
  from10000: [10000, undefined],
}

/** Convert the UI state into the exact public API parameter names and values. */
export function trophyBrowseQuery(
  category: LibraryCategory,
  filters: LibraryFilters,
  page: number,
  perPage = 24,
): TrophyBrowseQuery {
  const query: TrophyBrowseQuery = {
    page,
    per_page: perPage,
    sort: SORTS[category],
  }
  const search = filters.search.trim().slice(0, 100)
  if (search.length >= TROPHY_SEARCH_MIN_LENGTH) query.q = search
  if (filters.platforms.length) query['platform[]'] = [...filters.platforms]
  if (filters.platinum !== 'all') query.has_platinum = filters.platinum === 'yes' ? 1 : 0

  if (filters.owners !== 'all') {
    const [minimum, maximum] = OWNER_RANGES[filters.owners]
    if (minimum !== undefined) query.owners_min = minimum
    if (maximum !== undefined) query.owners_max = maximum
  }
  if (filters.rate !== 'all') {
    const [minimum, maximum] = RATE_RANGES[filters.rate]
    if (minimum !== undefined) query.platinum_rate_min = minimum
    if (maximum !== undefined) query.platinum_rate_max = maximum
  }
  return query
}

/** Stable request path; using it as the reactive fetch URL guarantees refetches. */
export function trophyBrowsePath(query: TrophyBrowseQuery): string {
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
  return `/trophies?${params.toString()}`
}

export interface LibraryState {
  category: LibraryCategory
  filters: LibraryFilters
  page: number
}

type RouteQueryValue = string | null | (string | null)[] | undefined

const CATEGORIES: readonly LibraryCategory[] = ['trending', 'new', 'popular']
const PLATINUM_FILTERS: readonly PlatinumFilter[] = ['all', 'yes', 'no']
const OWNERS_FILTERS: readonly OwnersFilter[] = ['all', 'under100', 'from100', 'from1000', 'from10000']
const RATE_FILTERS: readonly PlatinumRateFilter[] = ['all', 'under5', 'from5', 'from15', 'from30', 'from50']
export const LIBRARY_PLATFORMS = ['PS5', 'PS4', 'PS3', 'PSVITA', 'PSPC'] as const

const values = (value: RouteQueryValue) =>
  (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string')
const first = (value: RouteQueryValue) => values(value)[0] ?? ''
const oneOf = <T extends string>(value: RouteQueryValue, allowed: readonly T[], fallback: T): T =>
  allowed.includes(first(value) as T) ? first(value) as T : fallback

/** Read the page state from the route query, ignoring anything unrecognised. */
export function parseLibraryQuery(query: Record<string, RouteQueryValue>): LibraryState {
  const page = Number.parseInt(first(query.page), 10)
  const platforms = values(query.platform)
  return {
    category: oneOf(query.category, CATEGORIES, 'trending'),
    filters: {
      search: first(query.q).trim().slice(0, 100),
      platforms: LIBRARY_PLATFORMS.filter(platform => platforms.includes(platform)),
      platinum: oneOf(query.platinum, PLATINUM_FILTERS, 'all'),
      owners: oneOf(query.owners, OWNERS_FILTERS, 'all'),
      rate: oneOf(query.rate, RATE_FILTERS, 'all'),
    },
    page: Number.isFinite(page) && page > 1 ? page : 1,
  }
}

/** Inverse of `parseLibraryQuery`; default values are left out to keep URLs short. */
export function libraryRouteQuery({ category, filters, page }: LibraryState): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}
  if (category !== 'trending') query.category = category
  if (filters.search) query.q = filters.search
  if (filters.platforms.length) query.platform = [...filters.platforms]
  if (filters.platinum !== 'all') query.platinum = filters.platinum
  if (filters.owners !== 'all') query.owners = filters.owners
  if (filters.rate !== 'all') query.rate = filters.rate
  if (page > 1) query.page = String(page)
  return query
}
