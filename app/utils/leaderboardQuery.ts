import { REGIONS } from '~/utils/regions'

export const LEADERBOARD_DEFAULT_REGION = 'JP'

export interface LeaderboardQueryState {
  board: string
  region: string
  registeredOnly: boolean
  page: number
}

type RouteQueryValue = string | null | (string | null)[] | undefined

const firstValue = (value: RouteQueryValue) =>
  (Array.isArray(value) ? value : [value]).find((item): item is string => typeof item === 'string') ?? ''

/**
 * Read the leaderboard state from the route query, ignoring anything
 * unrecognised. `boards` lists the selectable board keys; the first is the default.
 */
export function parseLeaderboardQuery(
  query: Record<string, RouteQueryValue>,
  boards: readonly string[],
): LeaderboardQueryState {
  const board = firstValue(query.board)
  const region = firstValue(query.region).toUpperCase()
  const page = Number.parseInt(firstValue(query.page), 10)
  return {
    board: boards.includes(board) ? board : boards[0] ?? '',
    region: REGIONS.some(item => item.code === region) ? region : LEADERBOARD_DEFAULT_REGION,
    registeredOnly: firstValue(query.registered) === '1',
    page: Number.isFinite(page) && page > 1 ? page : 1,
  }
}

/**
 * Inverse of `parseLeaderboardQuery`; default values are left out to keep URLs
 * short. `defaultBoard` is the board an empty query resolves to.
 */
export function leaderboardRouteQuery(
  { board, region, registeredOnly, page }: LeaderboardQueryState,
  defaultBoard: string,
): Record<string, string> {
  const query: Record<string, string> = {}
  if (board !== defaultBoard) query.board = board
  if (region !== LEADERBOARD_DEFAULT_REGION) query.region = region
  if (registeredOnly) query.registered = '1'
  if (page > 1) query.page = String(page)
  return query
}

// ── Opening the board at a player ────────────────────────────────────────────
//
// A profile's rank opens its board at the page that player is on now. Which
// player travels as `navState('leaderboardPlayer')`, not in the URL, so links
// and the address bar stay plain board URLs: the leaderboard page asks the API
// for that player's page, then replaces the URL with that page.

/** The board a profile rank links to: points, or the player's region. */
export function leaderboardBoardPath(region?: string): string {
  const query = leaderboardRouteQuery({
    board: region ? 'points-region' : 'points',
    region: region ?? LEADERBOARD_DEFAULT_REGION,
    registeredOnly: false,
    page: 1,
  }, 'points')
  const search = new URLSearchParams(query).toString()
  return search ? `/leaderboard?${search}` : '/leaderboard'
}

