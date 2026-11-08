import type { DefinedTrophies } from '~/services/trophies'

/**
 * Title and description material for a trophy set page — plain functions, so
 * the rules are unit-tested (`tests/trophySeo.test.ts`).
 */

/**
 * What a PS3 or Vita set's own name ends in on PSN — "THE EYE OF JUDGMENT™
 * Trophies", "…　トロフィー" — which the page title already says. Newer
 * platforms name the game alone.
 */
const SET_NAME_SUFFIX = /[\s　]*(?:trophy set|trophies|trophäen|trophées|trofei|trofeos|troféus|trofeeën|トロフィー(?:セット)?|트로피|奖杯|獎盃)[\s　]*$/iu

export function trophySetSeoName(name: string, platforms: readonly string[]): string {
  if (!platforms.some(platform => platform === 'PS3' || platform === 'PSVITA')) return name
  return name.replace(SET_NAME_SUFFIX, '').trim() || name
}

/** Platforms the way people search for them: `PS5 / PS4`, `PS Vita`. */
export function seoPlatforms(platforms: readonly string[]): string {
  return platforms.map(platform => (platform === 'PSVITA' ? 'PS Vita' : platform)).join(' / ')
}

type RatedTrophy = { type: string, psn_earned_rate: number | string }

/** PSN's earn rate of the set's platinum trophy, or `null` when it has none. */
export function platinumEarnRate(groups: readonly { trophies: readonly RatedTrophy[] }[]): number | null {
  for (const group of groups) {
    const platinum = group.trophies.find(trophy => trophy.type === 'platinum')
    if (!platinum) continue
    const rate = Number(platinum.psn_earned_rate)
    return Number.isFinite(rate) ? rate : null
  }
  return null
}

/**
 * Median time to the platinum, in seconds, the way the statistics card reads
 * it: without add-on groups the platinum and 100% are the same finish, so the
 * completion median stands in; a set without a platinum has none.
 */
export function medianPlatinumTime(set: {
  defined_trophies: DefinedTrophies
  has_trophy_groups: boolean
  median_platinum_time: number | null
  median_completion_time: number | null
}): number | null {
  if (!(set.defined_trophies.platinum > 0)) return null
  return set.has_trophy_groups
    ? set.median_platinum_time
    : set.median_completion_time ?? set.median_platinum_time
}
