import type { GamePlatform, ReleaseDatePrecision } from '~/services/games'
import { currentLocale, tr } from '~/utils/locale'
import { platformLabel } from '~/utils/profile'

/**
 * Framework-free helpers for the game browser and game page (auto-imported
 * like the other `utils/` files). Imports are explicit so the unit tests can
 * load this file without Nuxt.
 */

/** PlayStation platforms get the coloured badges; everything else is shown neutral. */
const PLAYSTATION_PLATFORMS = new Set(['PS5', 'PS4', 'PS3', 'PSVITA', 'PSVR2', 'PSVR', 'PSP', 'PS2', 'PS1', 'PSPC'])

export const isPlayStationPlatform = (code: string) => PLAYSTATION_PLATFORMS.has(code)

/** Badge text: the site's PlayStation labels (PSVITA → PSV), otherwise IGDB's abbreviation, then the name. */
export function gamePlatformLabel(platform: GamePlatform): string {
  if (isPlayStationPlatform(platform.code)) return platformLabel(platform.code)
  return platform.abbreviation || platform.name
}

/**
 * A release date at its known precision, in the interface language — e.g.
 * `2022年2月25日`, `Feb 2026`, `Q3 2026`, `2026`, or "TBA" when there is none.
 *
 * Release dates are calendar days, not instants: they are formatted in UTC so a
 * visitor west of Greenwich doesn't see the day before.
 */
export function formatReleaseDate(date: string | null | undefined, precision: ReleaseDatePrecision | null | undefined): string {
  if (!date) return tr('games.tba')
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date

  const utc = new Date(Date.UTC(year, month - 1, day))
  const format = (options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(currentLocale(), { ...options, timeZone: 'UTC' }).format(utc)
    }
    catch {
      return date
    }
  }

  switch (precision) {
    case 'year': return format({ year: 'numeric' })
    case 'quarter': return tr('games.quarter', { year, quarter: Math.floor((month - 1) / 3) + 1 })
    case 'month': return format({ year: 'numeric', month: 'short' })
    default: return format({ year: 'numeric', month: 'short', day: 'numeric' })
  }
}

const REGIONS = new Set(['WW', 'NA', 'EU', 'JP', 'ASIA', 'CN', 'KR', 'AU', 'NZ', 'BR'])

/** Release region (`WW` = worldwide) in the interface language; unknown codes as-is. */
export function regionLabel(region: string): string {
  return REGIONS.has(region) ? tr(`games.regions.${region}`) : region
}

const STATUSES = new Set(['early_access', 'advanced_release', 'alpha', 'beta', 'cancelled', 'offline', 'full_release'])

/**
 * IGDB release status in the interface language. IGDB owns the list, so an
 * unknown status is shown as words (`some_status` → `Some status`).
 */
export function releaseStatusLabel(status: string): string {
  if (STATUSES.has(status)) return tr(`games.status.${status}`)
  const words = status.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
