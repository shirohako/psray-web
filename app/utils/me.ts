import type { FollowDirection } from '~/services/profile'
import type { AuthoredTipSort } from '~/types/tip'

type RouteQueryValue = string | null | (string | null)[] | undefined

const first = (value: RouteQueryValue) =>
  (Array.isArray(value) ? value : [value]).find((item): item is string => typeof item === 'string') ?? ''

const pageOf = (value: RouteQueryValue) => {
  const page = Number.parseInt(first(value), 10)
  return Number.isFinite(page) && page > 1 ? page : 1
}

// ── My follows (/me/following) ───────────────────────────────────────────────

export interface MyFollowsState {
  tab: FollowDirection
  page: number
}

/** Read the list state from the route query, ignoring anything unrecognised. */
export function parseMyFollowsQuery(query: Record<string, RouteQueryValue>): MyFollowsState {
  return {
    tab: first(query.tab) === 'followers' ? 'followers' : 'following',
    page: pageOf(query.page),
  }
}

/** Inverse of `parseMyFollowsQuery`; defaults are left out to keep URLs short. */
export function myFollowsRouteQuery(state: MyFollowsState): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.tab === 'followers') query.tab = 'followers'
  if (state.page > 1) query.page = String(state.page)
  return query
}

// ── My tips (/me/tips) ───────────────────────────────────────────────────────

export const AUTHORED_TIP_SORTS: readonly AuthoredTipSort[] = ['updated', 'created', 'helpful']

/** Longest search the API accepts. */
export const AUTHORED_TIP_SEARCH_MAX = 100

export interface MyTipsState {
  sort: AuthoredTipSort
  q: string
  page: number
}

/** Read the list state from the route query, ignoring anything unrecognised. */
export function parseMyTipsQuery(query: Record<string, RouteQueryValue>): MyTipsState {
  const sort = first(query.sort)
  return {
    sort: (AUTHORED_TIP_SORTS as readonly string[]).includes(sort) ? sort as AuthoredTipSort : 'updated',
    q: first(query.q).trim().slice(0, AUTHORED_TIP_SEARCH_MAX),
    page: pageOf(query.page),
  }
}

/** Inverse of `parseMyTipsQuery`; also the API query. Defaults are left out to keep URLs short. */
export function myTipsRouteQuery(state: MyTipsState): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.sort !== 'updated') query.sort = state.sort
  if (state.q) query.q = state.q
  if (state.page > 1) query.page = String(state.page)
  return query
}
