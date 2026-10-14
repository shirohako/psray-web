/**
 * Games service — types for the game browser (`/games`) and the game page
 * (`/games/:id`), mirroring `GET /games` and `GET /games/:id` (API docs:
 * `docs/api/games`). Both pages render server-side and fetch with
 * `useApiFetchRaw` / `useApiFetch` directly, so there is no imperative client.
 *
 * A game is not a trophy set: one game can have several sets (platforms,
 * regions) or none at all, and its releases cover every platform IGDB lists,
 * not only PlayStation.
 */
import type { TrophyBrowseItem } from '~/services/trophies'

/** How much of a release date is known; coarser dates are stored as the first day of the period. */
export type ReleaseDatePrecision = 'day' | 'month' | 'quarter' | 'year'

/** A release platform from the catalog. Filters and releases refer to it by `code`. */
export interface GamePlatform {
  /** e.g. `PS5`, `PSVITA`, `PC`, `SWITCH`; platforms added from IGDB use its slug in capitals. */
  code: string
  name: string
  /** IGDB's abbreviation (`Switch`, `Series X|S`); may be missing. */
  abbreviation: string | null
}

/** One game in `GET /games`; also the `game` of a trophy set page. */
export interface GameBrowseItem {
  id: number
  /** Common / original name. */
  name: string
  /** Name picked from `lang` / `Accept-Language`; always show this one. */
  localized_name: string
  /** Language of `localized_name`; `null` when it is the base `name`. */
  display_language: string | null
  /** Portrait (≈3:4) cover art. */
  cover_url: string | null
  /** Earliest release (`YYYY-MM-DD`); `null` while unannounced. */
  first_release_date: string | null
  first_release_precision: ReleaseDatePrecision | null
  /** Every platform the game was released on, PlayStation first. */
  platforms: GamePlatform[]
  trophy_set_count: number
}

export interface GameBrowseMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface GameBrowseQuery {
  page?: number
  per_page?: number
  q?: string
  'platform[]'?: string[]
}

/** One release: platform × region × date. A platform and region may repeat (early access, full release). */
export interface GameRelease {
  /** Platform `code`; look its name up in `GameDetail.platforms`. */
  platform: string
  /** `WW` (worldwide), `NA`, `EU`, `JP`, `ASIA`, `CN`, `KR`, `AU`, `NZ`, `BR`. */
  region: string
  /** `null` while unannounced. */
  release_date: string | null
  date_precision: ReleaseDatePrecision
  /** IGDB release status in snake_case (`early_access`, `cancelled`, …); `null` for a regular release. */
  status: string | null
}

/** Payload of `GET /games/:id`. */
export interface GameDetail extends GameBrowseItem {
  summary: string | null
  /** Summary in `display_language`, falling back to `summary`. */
  localized_summary: string | null
  /** The name in other languages; excludes `name`. */
  translations: { language_code: string, name: string }[]
  /** Abbreviations and alternative titles (FF7R, P5R…), also used by search. */
  aliases: string[]
  releases: GameRelease[]
  links: { source: string, url: string }[]
  /** Linked trophy sets, most played first — the same items as `GET /trophies`. */
  trophy_sets: TrophyBrowseItem[]
}
