/**
 * Profile service — the public PSN profile page (`/p/:psnid`).
 *
 * Mirrors the `users.ts` pattern: a typed `Profile` shape plus thin methods
 * built on `useApi()`. For the page itself we render server-side, so the page
 * setup calls `useApiFetch<Profile>('/profile/:psnid')` directly.
 */

import type { Rarity, TrophyType } from '~/services/trophies'
import type { ProfileRecentTip } from '~/types/tip'
import type { MediaImage } from '~/types/media'
import type { Screenshot } from '~/services/screenshots'

export type ApiDate = number | string

/** A PSN trophy profile as returned by `GET /profile/:psnid`. */
export interface Profile {
  id: number
  role: string
  psnid: string
  account_id: string
  status: number
  country: string
  language: string[]
  avatar_url: string
  /** Profile banner (9:2); `null` if the user hasn't set one. */
  banner: MediaImage | null
  about_me: string
  is_plus: boolean

  played_game_count: number
  completed_game_count: number
  abandoned_game_count: number

  trophy_level: number
  /** Progress toward the next trophy level, 0–100. */
  progress: number
  platinum: number
  gold: number
  silver: number
  bronze: number
  points: number

  rank: number | null
  server_rank: number | null

  favorite_game_count: number
  review_count: number
  follower_count: number
  following_count: number

  first_trophy_at: ApiDate | null
  last_trophy_at: ApiDate | null

  is_profile_public: boolean
  is_rankable: boolean

  star_piece: number
  rare_candy: number
  mira: number
  philosophers_stone: number
  tip_count: number
  tip_vote_count: number
  /** Null for PSN profiles that are not registered PSRay users. */
  recent_tips: ProfileRecentTip[] | null
  page_view_count: number

  sync_interval: number
  sync_next_at: ApiDate | null
  /** Last successful trophy sync; `null` until a profile completes a new sync. */
  last_synced_at: ApiDate | null
  registered_at: ApiDate | null

  used_space: number
  total_space: number
  created_at: ApiDate | null
  updated_at: ApiDate | null

  /** Whether the current viewer can follow this profile (logged in & not self). */
  can_follow: boolean
  /** Whether the current viewer is following this profile. */
  is_following: boolean
  /** Whether this profile follows the current viewer. */
  is_follower: boolean

  milestones: unknown | null
  /** `null` when the profile is private or the calendar showcase is off. */
  calendar?: CalendarDay[] | null
  social_account: unknown | null

  /**
   * The showcases to render, in the owner's order: only those switched on and
   * with something to show. Absent from API responses that predate showcases.
   */
  showcases?: ProfileShowcases
  /** The six lowest-PSN-rate trophies earned; `null` when private or the showcase is off. */
  rarest_trophies?: ShowcaseTrophy[] | null
  /** Up to 12 trophies the owner picked, in their order; `null` when private or the showcase is off. */
  featured_trophies?: ShowcaseTrophy[] | null
  /** Up to 6 played games (trophy sets) the owner picked; `null` when private or the showcase is off. */
  favorite_games?: ShowcaseGame[] | null
  /** The left column's text; `null` when the showcase is off or has no text. Shown on private profiles too. */
  text_left?: ShowcaseText | null
  /** The right column's text, as `text_left`. */
  text_right?: ShowcaseText | null
  /** Up to 6 public screenshots the owner picked, in their order; `null` when private or the showcase is off. */
  favorite_screenshots?: Screenshot[] | null
  /** The newest public screenshots (up to 6) and how many there are; `null` when the showcase is off. Shown on private profiles too. */
  screenshots?: { items: Screenshot[], total: number } | null
  /**
   * The owner's share card, once one has been drawn: `version` is when the card
   * file was last written (seconds), for the image URL's cache-busting query —
   * it changes on every redraw, style-only ones included. `null` when private,
   * the showcase is off, or no card exists yet.
   */
  share_card?: { version: string } | null
}

/** A showcase: a profile card its owner can switch off and reorder within its column. */
export type ShowcaseKey = 'calendar' | 'rarest' | 'featured' | 'games' | 'text_left' | 'favorite_screenshots' | 'tips' | 'social' | 'text_right' | 'screenshots' | 'share_card'
export type ShowcaseColumn = 'left' | 'right'

/** Showcases to render per column, in order (`GET /profile/:psnid`). */
export type ProfileShowcases = Record<ShowcaseColumn, ShowcaseKey[]>

/** One showcase in the owner's full layout (`GET /user/setting`), on or off. */
export interface ShowcaseSlot {
  key: ShowcaseKey
  on: boolean
}

/** The owner's full layout: every showcase of each column, in order. */
export type ShowcaseLayout = Record<ShowcaseColumn, ShowcaseSlot[]>

/** A favorite game: one of the owner's played trophy sets, name in the display language. */
export interface ShowcaseGame {
  id: number
  name: string
  display_language: string | null
  icon_url: string
  platform: string[]
}

/** A text showcase. `title` may be empty (the page shows a default); `body` is Markdown. */
export interface ShowcaseText {
  title: string
  body: string
}

/**
 * An earned trophy shown in the rarest or featured showcase: the `user_trophy`
 * row with the trophy and its set. Names are already in the display language.
 */
export interface ShowcaseTrophy {
  user_id: number
  trophy_set_id: number
  trophy_id: number
  /** `null` when PSN never recorded when it was earned. */
  earned_at: ApiDate | null
  trophy: {
    id: number
    type: TrophyType
    name: string
    detail: string
    icon_url: string
    /** PSN official earn rate, %, as a one-decimal string. */
    psn_earned_rate: number | string
    psray_rate: number | string
    rarity: Rarity
    /** Language `name` is in. */
    display_language: string | null
  }
  trophy_set: {
    id: number
    name: string
    display_language: string | null
    icon_url: string
    platform: string[]
  }
}

/** Trophy activity for one calendar day. */
export interface CalendarDay {
  /** Local calendar date in `YYYY-MM-DD` format. */
  date: string
  count: number
}

/** One trophy-count or platinum-count milestone. */
export interface ProfileMilestone {
  type: 'trophy' | 'platinum'
  /** Milestone number, returned as a numeric string by the API. */
  index: string
  trophy_set_id: number
  trophy_id: number
  /** Unix seconds. */
  earned_at: number
  trophyName: string
  trophyIconUrl: string
  trophySetName: string
}

/** Trophy tier counts. */
export interface TrophyCounts {
  bronze: number
  silver: number
  gold: number
  platinum: number
}

/** A game's trophy set (title metadata + aggregate stats). */
export interface TrophySet {
  id: number
  np_communication_id: string
  version: string
  /** e.g. `['PS5']` or `['PS4', 'PS5']`. */
  platform: string[]
  name: string
  detail: string
  icon_url: string
  has_trophy_groups: boolean
  np_service_name: string
  /** Trophy-set region, a two-letter code, e.g. `HK` | `JP` | `EU`. */
  region: string | null
  defined_trophies: TrophyCounts
  default_language: string | null
  owners: number
  recent_players: number
  average_progress: number
  completed_players: number
  platinum_achievers: number
  favorite_count: number
  wishlist_count: number
  review_count: number
  game_id: number | null
  created_at: ApiDate | null
  updated_at: ApiDate | null
  /** Best-matched language for the current viewer/request. */
  display_language?: string | null
  /** Trophy-set title translated to `display_language`; falls back to `name`. */
  localized_name?: string | null
  /** Present in recently-played responses, currently not displayed. */
  available_languages?: TrophySetAvailableLanguage[]
}

/** One available title translation from `recently-played`. */
export interface TrophySetAvailableLanguage {
  language_code: string
  is_default: boolean
  source: string
  name: string
}

/** One of a user's played titles, as returned by `recently-played`. */
export interface PlayedTrophySet {
  id: number
  user_id: number
  trophy_set_id: number
  /** Completion percent, 0–100. */
  progress: number
  earned_bronze: number
  earned_silver: number
  earned_gold: number
  earned_platinum: number
  duration: number | null
  /**
   * True when at least one earned trophy has no timestamp (early PSN titles).
   * `duration` is then meaningless and first/last only cover the timed trophies.
   */
  timestamps_incomplete?: boolean
  is_hidden: boolean
  first_earned_at: ApiDate | null
  last_earned_at: ApiDate | null
  trophy_set: TrophySet
}

/**
 * One trophy the user has earned, as returned by `recent-trophies`. The nested
 * `trophy` carries enough metadata to render a row (it omits the per-language
 * translations the trophy-set page would need).
 */
export interface RecentTrophy {
  user_id: number
  trophy_set_id: number
  trophy_id: number
  /** `null` when PSN never recorded when it was earned; these sort to the last pages. */
  earned_at: ApiDate | null
  trophy: {
    id: number
    trophy_group_id: number
    type: TrophyType
    np_communication_id: string
    psn_group_id: string
    psn_trophy_id: number
    name: string
    detail: string
    /** The set's default language, which `name` and `detail` are in. */
    display_language?: string | null
    icon_url: string
    is_hidden: boolean
    /** PSN official earn rate, %. */
    psn_earned_rate: number | string
    /** Site-wide earn rate, %. */
    psray_rate: number
    earned_count: number
    rarity: Rarity
    tip_count: number
  }
}

/** One row of a profile's following / followers list. */
export interface ProfileFollowEntry {
  profile_id: number
  psnid: string
  avatar_url: string
  country: string
  trophy_level: number
  /** When the follow was made: `YYYY-MM-DD HH:MM:SS` in UTC, with no zone marker. */
  followed_at: string
}

/** A row of the signed-in user's own following / followers list (`GET /user/:direction`). */
export interface MyFollowEntry extends ProfileFollowEntry {
  /** Whether the follow goes both ways. */
  is_mutual: boolean
}

/** Pagination of a follow list. */
export interface FollowPageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

/** Which way a profile's follow list points. */
export type FollowDirection = 'following' | 'followers'

/** Response of the follow/unfollow endpoints. */
export interface FollowResult {
  following: boolean
}

export function useProfiles() {
  const { get, post, delete: del, raw } = useApi()

  return {
    find: (psnid: string) => get<Profile>(`/profile/${psnid}`),

    /** Follow a user. Idempotent — re-following an already-followed user succeeds. */
    follow: (psnid: string) => post<FollowResult>(`/user/following/${psnid}`),

    /** Unfollow a user. Idempotent — unfollowing a non-followed user succeeds. */
    unfollow: (psnid: string) => del<FollowResult>(`/user/following/${psnid}`),

    /**
     * Who the profile follows, or who follows it, newest first, 30 a page
     * (returns the `{ data, meta }` envelope). Public: the same with or
     * without a session, and still served for a private profile.
     */
    follows: (psnid: string, direction: FollowDirection, page = 1) =>
      raw.get<ProfileFollowEntry[], FollowPageMeta>(`/profile/${encodeURIComponent(psnid)}/${direction}`, { query: { page } }),
  }
}
