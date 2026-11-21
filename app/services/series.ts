/**
 * Series service — types for the series browser (`/series`), the series page
 * (`/series/:id`), the profile's series tab and the "part of a series" cards,
 * mirroring `GET /series`, `GET /series/:id` and `GET /profile/:psnid/series`
 * (API docs: `docs/api/series`). Pages fetch with `useApiFetch(Raw)` directly.
 *
 * A series lists **stages** in order; each stage holds the versions of one work
 * (platforms, regions, remakes). `main` stages are numbered and count towards a
 * full clear; `side` stages are spin-offs that don't.
 */
import type { TrophyBrowseItem } from '~/services/trophies'

/** How far a player got in one stage. */
export type StageState = 'complete' | 'platinum' | 'started' | 'none'

/** How far a player got in the whole series (main stages only). */
export type SeriesStatus = 'complete' | 'partial' | 'started' | 'none'

export type StageKind = 'main' | 'side'

/** One series in a list; also the base of the detail payload. */
export interface SeriesItem {
  id: number
  /** Default name (usually IGDB's English collection name). */
  name: string
  /** Name picked from `lang` / `Accept-Language`; always show this one. */
  localized_name: string
  display_language: string | null
  /** Cover chosen by an admin; usually `null`, then use `covers`. */
  cover_url: string | null
  /** Up to four stage icons, in stage order (PS5 art is square, older art landscape). */
  covers: string[]
  stage_count: number
  side_count: number
  trophy_set_count: number
  popularity: number
  first_year: number | null
  last_year: number | null
  /** Version of the generated share card, `null` until one exists; see `seriesCardUrl()`. */
  card: string | null
}

/** `GET /series` item: the signed-in viewer's own progress, `null` when anonymous or unplayed. */
export interface SeriesBrowseItem extends SeriesItem {
  viewer_progress: { status: SeriesStatus; done: number; total: number } | null
}

export interface SeriesBrowseMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export type SeriesSort = 'popular' | 'recent' | 'name'

/** A trophy set inside a stage: the trophy browser's list item plus region and game. */
export interface SeriesEntry extends Pick<TrophyBrowseItem,
  'id' | 'np_communication_id' | 'name' | 'localized_name' | 'display_language' | 'default_language'
  | 'platform' | 'icon_url' | 'defined_trophies' | 'owners' | 'completed_players' | 'platinum_rate' | 'completion_rate'> {
  region: string | null
  game_id: number | null
}

export interface SeriesStage {
  id: number
  kind: StageKind
  /** 1-based number among main stages; `null` for side stages. */
  number: number | null
  name: string
  /** Release date of the original (`YYYY-MM-DD`); may be `null`. */
  release_date: string | null
  entries: SeriesEntry[]
}

/** A player's progress on one trophy set of the series. */
export interface SeriesEntryProgress {
  trophy_set_id: number
  progress: number
  earned_platinum: number
  earned_gold: number
  earned_silver: number
  earned_bronze: number
  last_earned_at: string | null
}

/**
 * Progress of the `?psnid=` player. Only `psnid`, `found`, `is_public` and
 * `avatar_url` are there when the player is unknown (`found: false`) or private.
 */
export interface SeriesViewer {
  psnid: string
  found: boolean
  is_public: boolean
  avatar_url: string | null
  status?: SeriesStatus
  done?: number
  total?: number
  played?: number
  last_played_at?: string | null
  stages?: { id: number; state: StageState; best: number }[]
  entries?: SeriesEntryProgress[]
}

/** Payload of `GET /series/:id`. */
export interface SeriesDetail extends SeriesItem {
  description: string | null
  /** PSN language codes the series name is translated into; decides which editions are indexed. */
  languages: string[]
  /** One version of every main stage, the most played, added up. */
  tier_totals: { platinum: number; gold: number; silver: number; bronze: number }
  stages: SeriesStage[]
  viewer: SeriesViewer | null
}

/** `GET /profile/:psnid/series` item. */
export interface ProfileSeriesItem extends SeriesItem {
  progress: {
    status: SeriesStatus
    done: number
    total: number
    played: number
    last_played_at: string | null
    /** State of every main stage, in order. */
    stages: StageState[]
    /** State of every side stage, in order. */
    side: StageState[]
  }
}

export type ProfileSeriesFilter = 'all' | 'complete' | 'partial' | 'started'
export type ProfileSeriesSort = 'recent' | 'progress' | 'name'

export interface ProfileSeriesMeta extends SeriesBrowseMeta {
  counts: Record<ProfileSeriesFilter, number>
}

/** A series a trophy set (or a game's sets) belongs to, on the trophy and game pages. */
export interface SeriesMembership extends SeriesItem {
  stage_number: number | null
  stage_kind: StageKind
}
