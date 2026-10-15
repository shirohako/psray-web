import type { TrophyType } from '~/services/trophies'

export type TipLanguage =
  | 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru'
  | 'nl' | 'fi' | 'sv' | 'da' | 'nb' | 'pl' | 'tr' | 'ar' | 'cs' | 'hu'
  | 'el' | 'ro' | 'th'

export interface TipPageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface TrophyTipPageMeta extends TipPageMeta {
  /** Whether the authenticated viewer already has a Tip for this trophy. */
  has_my_tip: boolean
}

/** Fields shared by Tip responses from trophy and profile endpoints. */
export interface TipBase {
  id: number
  trophy_id: number
  user_id: number
  content: string
  content_type: 'markdown'
  language: TipLanguage
  has_spoiler: boolean
  missable: boolean | null
  vote_up_count: number
  vote_down_count: number
  created_at: string
  updated_at: string
}

export interface TipAuthor {
  id: number
  psnid: string
  country?: string | null
  avatar_url?: string | null
  plus?: boolean | number
  trophy_level?: number
}

export interface TipTrophy {
  id: number
  name: string
  detail?: string | null
  icon_url: string
  type: TrophyType
}

/** The trophy set (game) a Tip's trophy belongs to, titled in the display language. */
export interface TipTrophySet {
  id: number
  name: string
  icon_url: string
  platform: string[]
}

/** Tip returned by `GET /trophies/trophy/:id/tips`. */
export interface TrophyTip extends TipBase {
  user: TipAuthor
  /** The signed-in viewer's mutually exclusive evaluation. */
  viewer_vote: TipVote | null
  /** False for anonymous viewers and the Tip's own author. */
  can_vote: boolean
}

/** The signed-in user's own Tip returned by the singular read/write endpoint. */
export interface OwnTrophyTip extends TipBase {
  trophy_set_id: number
  viewer_vote: null
  can_vote: false
  user?: TipAuthor | Record<string, never>
}

/** Tip returned by `GET /profile/:psnid/tips` and `GET /user/tips`. */
export interface ProfileTip extends TipBase {
  /** Trophy-set route id used by the trophy deep link; null when the trophy is gone. */
  trophy_set_id: number | null
  /** May be null when the related trophy is no longer available. */
  trophy: TipTrophy | null
  /** Null when the related trophy (or its set) is no longer available. */
  trophy_set: TipTrophySet | null
}

/** Orders for `GET /user/tips`: last edit (default), publication, or most helpful. */
export type AuthoredTipSort = 'updated' | 'created' | 'helpful'

/** Lightweight Tip embedded in `GET /profile/:psnid`. */
export interface ProfileRecentTip extends Omit<ProfileTip, 'user_id'> {
  user_id?: number
}

/** Payload for the per-user, per-trophy upsert endpoint. */
export interface SaveTrophyTipPayload {
  content: string
  language: TipLanguage
  has_spoiler?: boolean
  missable?: boolean | null
}

export type TipVote = 1 | -1
