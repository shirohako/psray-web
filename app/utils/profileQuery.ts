export type ProfileTab = 'recent' | 'trophies' | 'milestones'

export const PROFILE_TABS: readonly ProfileTab[] = ['recent', 'trophies', 'milestones']

export interface ProfileQueryState {
  tab: ProfileTab
  page: number
  /** Recently-played search; only meaningful on the `recent` tab. */
  q: string
}

type RouteQueryValue = string | null | (string | null)[] | undefined

const firstValue = (value: RouteQueryValue) =>
  (Array.isArray(value) ? value : [value]).find((item): item is string => typeof item === 'string') ?? ''

/** Read the profile tab state from the route query, ignoring anything unrecognised. */
export function parseProfileQuery(query: Record<string, RouteQueryValue>): ProfileQueryState {
  const tab = firstValue(query.tab) as ProfileTab
  const page = Number.parseInt(firstValue(query.page), 10)
  const activeTab = PROFILE_TABS.includes(tab) ? tab : 'recent'
  return {
    tab: activeTab,
    page: activeTab !== 'milestones' && Number.isFinite(page) && page > 1 ? page : 1,
    q: activeTab === 'recent' ? firstValue(query.q).trim() : '',
  }
}

/** Inverse of `parseProfileQuery`; default values are left out to keep URLs short. */
export function profileRouteQuery({ tab, page, q }: ProfileQueryState): Record<string, string> {
  const query: Record<string, string> = {}
  if (tab !== 'recent') query.tab = tab
  if (tab === 'recent' && q) query.q = q
  if (tab !== 'milestones' && page > 1) query.page = String(page)
  return query
}
