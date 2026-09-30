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
