import type { TrophyBrowseQuery, TrophyBrowseSort } from '~/services/trophies'

export type LibraryCategory = 'new' | 'trending' | 'popular'
export type PlatinumFilter = 'all' | 'yes' | 'no'
export type PlatinumRateFilter = 'all' | 'under5' | 'from5' | 'from15' | 'from30' | 'from50'
export type OwnersFilter = 'all' | 'under100' | 'from100' | 'from1000' | 'from10000'

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
  trending: 'recent_hot',
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
  if (search) query.q = search
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
