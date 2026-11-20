import type {
  SeriesEntry,
  SeriesEntryProgress,
  SeriesItem,
  SeriesSort,
  SeriesStage,
  SeriesViewer,
  StageState,
} from '~/services/series'
import { TROPHY_SEARCH_MIN_LENGTH } from '~/utils/trophyLibrary'

/** Divides evenly into the 1 / 2 / 3 column card grid. */
export const SERIES_PAGE_SIZE = 24

export const SERIES_SORTS: readonly SeriesSort[] = ['popular', 'recent', 'name']

/** How many versions a stage shows before "show the other N". */
const GUEST_VISIBLE_ENTRIES = 3
const VIEWER_VISIBLE_ENTRIES = 2

export interface SeriesLibraryState {
  search: string
  sort: SeriesSort
  page: number
}

type RouteQueryValue = string | null | (string | null)[] | undefined

const first = (value: RouteQueryValue) =>
  (Array.isArray(value) ? value : [value]).find((item): item is string => typeof item === 'string') ?? ''

/** Read the series browser state from the route query, ignoring anything unrecognised. */
export function parseSeriesLibraryQuery(query: Record<string, RouteQueryValue>): SeriesLibraryState {
  const page = Number.parseInt(first(query.page), 10)
  const sort = first(query.sort) as SeriesSort
  return {
    search: first(query.q).trim().slice(0, 100),
    sort: SERIES_SORTS.includes(sort) ? sort : 'popular',
    page: Number.isFinite(page) && page > 1 ? page : 1,
  }
}

/** Inverse of `parseSeriesLibraryQuery`; defaults are left out to keep URLs short. */
export function seriesLibraryRouteQuery({ search, sort, page }: SeriesLibraryState): Record<string, string> {
  const query: Record<string, string> = {}
  if (search) query.q = search
  if (sort !== 'popular') query.sort = sort
  if (page > 1) query.page = String(page)
  return query
}

/** API path for one page of the browser; short searches are dropped like the API would reject them. */
export function seriesBrowsePath({ search, sort, page }: SeriesLibraryState, perPage = SERIES_PAGE_SIZE): string {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage), sort })
  if (search.length >= TROPHY_SEARCH_MIN_LENGTH) params.set('q', search)
  return `/series?${params.toString()}`
}

/** "2004–2024", a single year, or '' when unknown. */
export function seriesYears(series: Pick<SeriesItem, 'first_year' | 'last_year'>): string {
  const { first_year: from, last_year: to } = series
  if (from == null && to == null) return ''
  if (from == null || to == null || from === to) return String(from ?? to)
  return `${from}–${to}`
}

/** The cover to lead with: an admin's pick, else the newest stage's icon. */
export function seriesCover(series: Pick<SeriesItem, 'cover_url' | 'covers'>): string | null {
  return series.cover_url ?? series.covers[series.covers.length - 1] ?? null
}

export const mainStages = (stages: SeriesStage[]) => stages.filter(stage => stage.kind === 'main')
export const sideStages = (stages: SeriesStage[]) => stages.filter(stage => stage.kind === 'side')

/** The viewer's progress keyed by trophy set id (empty for guests and private profiles). */
export function entryProgressMap(viewer: SeriesViewer | null | undefined): Map<number, SeriesEntryProgress> {
  return new Map((viewer?.entries ?? []).map(entry => [entry.trophy_set_id, entry]))
}

/** The viewer's state of each stage keyed by stage id. */
export function stageStateMap(viewer: SeriesViewer | null | undefined): Map<number, { state: StageState; best: number }> {
  return new Map((viewer?.stages ?? []).map(stage => [stage.id, { state: stage.state, best: stage.best }]))
}

/**
 * A stage's versions in display order. Guests see the order the admins set
 * (most played first by default); a player sees what they played first,
 * furthest along first, then the rest in that same order.
 */
export function orderStageEntries(entries: SeriesEntry[], progress: Map<number, SeriesEntryProgress>): SeriesEntry[] {
  if (!progress.size) return entries
  const index = new Map(entries.map((entry, i) => [entry.id, i]))
  return [...entries].sort((a, b) => {
    const pa = progress.get(a.id)
    const pb = progress.get(b.id)
    if (pa && pb) return pb.progress - pa.progress || index.get(a.id)! - index.get(b.id)!
    if (pa || pb) return pa ? -1 : 1
    return index.get(a.id)! - index.get(b.id)!
  })
}

/**
 * How many versions to show before folding the rest: three for guests; for a
 * player everything they played, and at least two.
 */
export function visibleEntryCount(entries: SeriesEntry[], progress: Map<number, SeriesEntryProgress>): number {
  if (!progress.size) return Math.min(entries.length, GUEST_VISIBLE_ENTRIES)
  const played = entries.filter(entry => progress.has(entry.id)).length
  return Math.min(entries.length, Math.max(played, VIEWER_VISIBLE_ENTRIES))
}

/** Share of main stages cleared, 0–100. */
export function seriesPercent(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0
}
