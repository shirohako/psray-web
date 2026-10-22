import type { ApiDate, EarnedInfo, Trophy, TrophyGroup, ViewerProgress } from '~/services/trophies'

/**
 * Framework-free logic behind the trophy list on the trophy-set page: PSN's
 * group and trophy order, row numbers, the viewer's earned order, and the
 * list's filter and sort modes.
 */

/** Which trophies the list shows. `earned` / `unearned` need a viewer (`?psnid=`). */
export type TrophyFilterMode = 'all' | 'earned' | 'unearned'

/** List order. `earned` (the viewer's earned order) needs a viewer. */
export type TrophySortMode = 'default' | 'earned' | 'rarity'

// Parse an API date (unix seconds or ISO string) to epoch ms, or null.
function toMs(value: ApiDate | null): number | null {
  if (value == null || value === '') return null
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  const t = date.getTime()
  return Number.isNaN(t) ? null : t
}

/**
 * Maps each earned trophy's db id to its chronological earned position (0-based
 * `rank`, also drives the "by earned time" sort), timestamp, and seconds since the
 * previously earned trophy (`null` for the first). The raw `earned_trophies`
 * list isn't guaranteed to be time-sorted, so we order by `earned_trophies_at`
 * to get the true "this is the Nth trophy earned" sequence and gaps (trophies
 * missing a timestamp sort last). `timestampMissing` marks trophies the API
 * explicitly reports as earned with a `null` time (early PSN titles).
 */
export function buildEarnedInfo(
  progress: ViewerProgress | null | undefined,
  groups: readonly TrophyGroup[],
): Map<number, EarnedInfo> {
  const m = new Map<number, EarnedInfo>()
  if (!progress) return m

  // Platinum is awarded in the same instant as the trophy that completes the
  // set, so they share a timestamp. Treat platinum as earned last in any tie so
  // it ranks after the trophy that actually triggered it.
  const isPlatinum = new Set<number>()
  for (const group of groups) {
    for (const t of group.trophies) {
      if (t.type === 'platinum') isPlatinum.add(t.id)
    }
  }

  const times = progress.earned_trophies_at ?? {}
  const ordered = progress.earned_trophies
    .map(id => ({ id, earnedAt: times[id] ?? null, missing: times[id] === null, ms: toMs(times[id] ?? null) }))
    .sort((a, b) => {
      if (a.ms == null) return b.ms == null ? 0 : 1
      if (b.ms == null) return -1
      if (a.ms !== b.ms) return a.ms - b.ms
      // Same timestamp: platinum sorts after non-platinum.
      return Number(isPlatinum.has(a.id)) - Number(isPlatinum.has(b.id))
    })

  let prevMs: number | null = null
  ordered.forEach(({ id, earnedAt, missing, ms }, i) => {
    const sincePrev = i > 0 && ms != null && prevMs != null
      ? Math.round((ms - prevMs) / 1000)
      : null
    m.set(id, { rank: i, earnedAt, sincePrev, timestampMissing: missing })
    if (ms != null) prevMs = ms
  })

  return m
}

function groupSortKey(group: TrophyGroup) {
  if (group.psn_group_id === 'default') return -1
  const numeric = Number(group.psn_group_id)
  return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER
}

/**
 * Groups in PSN order: base game first (`default`), then DLC groups (`001`,
 * `002`, ...). Trophies inside each group follow PSN's own id. Returns copies;
 * the input is left as it is.
 */
export function sortTrophyGroups(groups: readonly TrophyGroup[]): TrophyGroup[] {
  return [...groups]
    .sort((a, b) =>
      groupSortKey(a) - groupSortKey(b)
      || a.psn_group_id.localeCompare(b.psn_group_id)
      || a.id - b.id,
    )
    .map(group => ({
      ...group,
      trophies: [...group.trophies].sort((a, b) =>
        a.psn_trophy_id - b.psn_trophy_id || a.id - b.id,
      ),
    }))
}

/** Row number per trophy (db id → number): PSN's zero-based trophy id shifted to user-facing 1-based. */
export function buildTrophyNumbers(groups: readonly TrophyGroup[]): Map<number, number> {
  const m = new Map<number, number>()
  for (const group of groups) {
    for (const t of group.trophies) m.set(t.id, t.psn_trophy_id + 1)
  }
  return m
}

/**
 * Whether the viewer has earned `trophy`; never without a viewer. The API's
 * own `earned_by_viewer` flag wins over the viewer's earned list.
 */
export function isTrophyEarned(trophy: Trophy, hasViewer: boolean, earnedInfo: ReadonlyMap<number, EarnedInfo>): boolean {
  return hasViewer && (trophy.earned_by_viewer ?? earnedInfo.has(trophy.id))
}

/** The trophies `filter` keeps. Earned-based filters only apply with a viewer. */
export function filterTrophies(
  trophies: readonly Trophy[],
  filter: TrophyFilterMode,
  hasViewer: boolean,
  earnedInfo: ReadonlyMap<number, EarnedInfo>,
): readonly Trophy[] {
  if (!hasViewer || filter === 'all') return trophies
  const want = filter === 'earned'
  return trophies.filter(t => isTrophyEarned(t, hasViewer, earnedInfo) === want)
}

/**
 * `trophies` in `sort` order; `default` keeps the order they came in. The
 * earned-time sort only applies with a viewer.
 */
export function sortTrophies(
  trophies: readonly Trophy[],
  sort: TrophySortMode,
  hasViewer: boolean,
  earnedInfo: ReadonlyMap<number, EarnedInfo>,
): readonly Trophy[] {
  if (sort === 'rarity') {
    // Lower PSN earn rate = rarer, so ascending puts the rarest first.
    return [...trophies].sort((a, b) => Number(a.psn_earned_rate) - Number(b.psn_earned_rate))
  }
  if (sort === 'earned' && hasViewer) {
    // Earned trophies first, in the order the viewer earned them; rest after.
    return [...trophies].sort((a, b) => {
      const ra = earnedInfo.get(a.id)?.rank ?? Infinity
      const rb = earnedInfo.get(b.id)?.rank ?? Infinity
      return ra - rb
    })
  }
  return trophies
}

/** How many trophies the list shows across all groups under `filter`. */
export function countVisibleTrophies(
  groups: readonly TrophyGroup[],
  filter: TrophyFilterMode,
  hasViewer: boolean,
  earnedInfo: ReadonlyMap<number, EarnedInfo>,
): number {
  return groups.reduce((count, group) => count + filterTrophies(group.trophies, filter, hasViewer, earnedInfo).length, 0)
}
