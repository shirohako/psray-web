import type { Profile } from '~/services/profile'
import { REGIONS } from '~/utils/regions'

/**
 * Shared, framework-free helpers for the profile page and its components.
 * Files under `app/utils/` are auto-imported by Nuxt, so just call e.g.
 * `fmt(n)` or `trophyKinds` from any component without importing.
 */

const nf = new Intl.NumberFormat('en-US')

/** Thousands-separated number, or「—」for null/undefined. */
export const fmt = (n: number | null | undefined) => (n == null ? '—' : nf.format(n))

type DateLike = number | string | null | undefined

function toDate(value: DateLike) {
  if (value == null || value === '') return null
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * An API timestamp (ISO string, or Unix seconds when numeric) as an ISO string
 * with a zone, for `<LocalTime>`; null when missing or unparseable.
 */
export function toIsoDate(value: DateLike): string | null {
  return toDate(value)?.toISOString() ?? null
}

/** Date only, in the active language, e.g. `May 29, 2026`. */
export function fmtDate(value: DateLike) {
  const date = toDate(value)
  if (!date) return '—'
  return date.toLocaleDateString(currentLocale(), {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

/** Absolute date down to the minute, e.g. `2026/05/29 14:30`. */
export function fmtDateTime(value: DateLike) {
  const date = toDate(value)
  if (!date) return '—'
  return date.toLocaleString(currentLocale(), {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

/**
 * An API interval expressed in hours → an exact, localized readable duration.
 * Prefer larger units only when no rounding is needed: 168h becomes “1 week”,
 * 720h remains “30 days”, and the backend maximum 8760h becomes “1 year”.
 */
export type HourIntervalUnit = 'hour' | 'day' | 'week' | 'year'

export interface HourInterval {
  amount: number
  unit: HourIntervalUnit
}

export function resolveHourInterval(
  value: number | null | undefined,
): HourInterval | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null

  let amount = value
  let unit: HourIntervalUnit = 'hour'
  if (value === 365 * 24) {
    amount = 1
    unit = 'year'
  }
  else if (value % (7 * 24) === 0) {
    amount = value / (7 * 24)
    unit = 'week'
  }
  else if (value % 24 === 0) {
    amount = value / 24
    unit = 'day'
  }

  return { amount, unit }
}

export function formatHourInterval(
  value: number | null | undefined,
  locale = currentLocale(),
): string | null {
  const interval = resolveHourInterval(value)
  if (!interval) return null

  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: interval.unit,
    unitDisplay: 'long',
    maximumFractionDigits: 2,
  }).format(interval.amount)
}

/**
 * A duration in seconds → a compact two-unit label, e.g. `2y 3mo` or `3d 14h`.
 * Month/year values deliberately use 30/365-day duration buckets rather than
 * calendar arithmetic because callers provide elapsed seconds, not two dates.
 * `Intl.DurationFormat` isn't available across our Node/Safari floor, so the
 * unit pairs come from the message catalog (`time.*`).
 */
export function formatDuration(sec: number | null | undefined) {
  if (sec == null) return '—'
  const d = Math.floor(sec / 86_400)
  const h = Math.floor((sec % 86_400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (d >= 365) {
    const y = Math.floor(d / 365)
    const mo = Math.floor((d % 365) / 30)
    return mo > 0 ? tr('time.yearMonth', { y, mo }) : tr('time.year', { y })
  }
  if (d >= 30) {
    const mo = Math.floor(d / 30)
    const rest = d % 30
    return rest > 0 ? tr('time.monthDay', { mo, d: rest }) : tr('time.month', { mo })
  }
  if (d > 0) return tr('time.dayHour', { d, h })
  if (h > 0) return tr('time.hourMinute', { h, m })
  if (m > 0) return tr('time.minuteSecond', { m, s })
  return tr('time.second', { s })
}

/**
 * A duration as a stopwatch reading: `8:57:12`, or `05:10:10` plus whole days,
 * which come back separately so the caller can label them (`<TrophyStopwatch>`). Seconds stay, so two
 * close runs never read the same.
 */
export function stopwatch(sec: number): { days: number; time: string } {
  const total = Math.max(0, Math.floor(sec))
  const days = Math.floor(total / 86_400)
  const h = Math.floor((total % 86_400) / 3600)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { days, time: `${days ? pad(h) : h}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}` }
}


/**
 * Gap between two consecutively earned trophies, in English units spaced for
 * readability, e.g.「18 h 12 m 15 s」「1 d 3 h」「5 s」. Lists every non-zero
 * unit (d/h/m/s).「< 1 s」for sub-second gaps;「null」when there's no previous
 * trophy to compare against.
 */
export function fmtEarnGap(sec: number | null | undefined) {
  if (sec == null) return null
  if (sec < 1) return '< 1 s'
  const d = Math.floor(sec / 86_400)
  const h = Math.floor((sec % 86_400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const parts: string[] = []
  if (d) parts.push(`${d} d`)
  if (h) parts.push(`${h} h`)
  if (m) parts.push(`${m} m`)
  if (s) parts.push(`${s} s`)
  return parts.join(' ')
}

/**
 * Coarse relative time, e.g. `3 days ago`.
 *
 * `numeric: 'auto'` is what makes today/yesterday come out as words in every
 * language, so those cases need no special-casing here.
 */
export function fromNow(value: DateLike) {
  const date = toDate(value)
  if (!date) return '—'
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  const rtf = new Intl.RelativeTimeFormat(currentLocale(), { numeric: 'auto' })
  if (days < 1) return rtf.format(0, 'day')
  if (days < 30) return rtf.format(-days, 'day')
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month')
  return rtf.format(-Math.floor(days / 365), 'year')
}

const REGION_NAMES = Object.fromEntries(REGIONS.map(r => [r.code, r.name]))

// English country names derived from our stable region list first. Intl is only
// a fallback because Node and browsers can ship different ICU display names.
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
/** Country code → English country name (falls back to the raw code). */
export function regionName(c: string) {
  if (!/^[A-Za-z]{2}$/.test(c)) return c
  const code = c.toUpperCase()
  if (REGION_NAMES[code]) return REGION_NAMES[code]
  try {
    return regionNames.of(code) ?? c
  }
  catch {
    return c
  }
}

/**
 * schema.org `ProfilePage` structured data for a profile page at `url`, or
 * `null` when there is nothing to advertise. Only registered PSRay members are
 * creators affiliated with this site: a synced-only PSN record is useful
 * content, but it is not a community profile. A private profile gets none.
 */
export function profilePageJsonLd(p: Profile, url: string, inLanguage: string): Record<string, unknown> | null {
  if (!p.is_profile_public || p.registered_at == null) return null

  const person: Record<string, unknown> = {
    '@id': `${url}#person`,
    '@type': 'Person',
    'name': p.psnid,
    'identifier': p.psnid,
    'url': url,
    'image': p.avatar_url,
    'interactionStatistic': [{
      '@type': 'InteractionCounter',
      'interactionType': 'https://schema.org/FollowAction',
      'userInteractionCount': p.follower_count,
    }],
    'agentInteractionStatistic': [
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/FollowAction',
        'userInteractionCount': p.following_count,
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/WriteAction',
        'userInteractionCount': p.tip_count,
      },
    ],
  }
  if (p.about_me) person.description = p.about_me

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'url': url,
    'dateCreated': toIsoDate(p.registered_at) ?? undefined,
    'inLanguage': inLanguage,
    'mainEntity': person,
  }
}

/** A rank value: `#1,234`, or the "unranked" label when the user has no rank yet. */
export const rankText = (r: number | null | undefined) =>
  (r == null ? tr('profile.stats.unranked') : `#${fmt(r)}`)

/** Sum of all four trophy tiers. */
export const sumTrophies = (p: Profile) => p.platinum + p.gold + p.silver + p.bronze

export type PlatformValue = string | string[] | null | undefined

/** Normalize legacy single-platform strings and current platform arrays. */
export function platformList(platform: PlatformValue): string[] {
  if (Array.isArray(platform)) return platform.filter(Boolean)
  return platform ? [platform] : []
}

/** Compact platform label for badges. */
export function platformLabel(platform: string): string {
  if (platform === 'PSVITA') return 'PSV'
  if (platform === 'PSVR2') return 'PS VR2'
  if (platform === 'PSVR') return 'PS VR'
  return platform
}

/**
 * Tailwind classes for a platform badge (filled, white text). Cohesive palette:
 * PS5 stays near-black (brand), the rest are distinct same-weight hues.
 */
export function platformBadgeClass(platform: string): string {
  switch (platform) {
    case 'PS5': return 'bg-slate-900 text-white'
    case 'PS4': return 'bg-sky-600 text-white'
    case 'PS3': return 'bg-teal-600 text-white'
    case 'PSVITA':
    case 'PSV': return 'bg-rose-500 text-white'
    case 'PSP':
    case 'PSPC': return 'bg-amber-600 text-white'
    case 'PSVR2':
    case 'PSVR': return 'bg-violet-600 text-white'
    default: return 'bg-slate-600 text-white'
  }
}

export type TrophyKey = 'platinum' | 'gold' | 'silver' | 'bronze'

/**
 * Display metadata for the four trophy tiers (order = platinum → bronze).
 * Pure data — the tier name is a message key, resolved at the call site so the
 * label follows the active language.
 */
export const trophyKinds: { key: TrophyKey; labelKey: string; dot: string; text: string }[] = [
  { key: 'platinum', labelKey: 'trophy.tier.platinum', dot: 'bg-cyan-400', text: 'text-cyan-600' },
  { key: 'gold', labelKey: 'trophy.tier.gold', dot: 'bg-amber-400', text: 'text-amber-600' },
  { key: 'silver', labelKey: 'trophy.tier.silver', dot: 'bg-slate-400', text: 'text-slate-500' },
  { key: 'bronze', labelKey: 'trophy.tier.bronze', dot: 'bg-orange-400', text: 'text-orange-600' },
]

/**
 * A player's earned count for each tier, in `trophyKinds` order with the
 * tier's dot colour, from any record with `earned_platinum` … `earned_bronze`.
 */
export function earnedTiers(record: Record<`earned_${TrophyKey}`, number>) {
  return trophyKinds.map(kind => ({ dot: kind.dot, count: record[`earned_${kind.key}` as const] }))
}

/**
 * Trophy-level tier, after PlayStation's level icons: bronze for 1–299, silver
 * for 300–599, gold for 600–998, platinum from 999. The site's level has no cap,
 * so everything past 999 stays platinum.
 */
export function levelTier(level: number): TrophyKey {
  if (level >= 999) return 'platinum'
  if (level >= 600) return 'gold'
  if (level >= 300) return 'silver'
  return 'bronze'
}
