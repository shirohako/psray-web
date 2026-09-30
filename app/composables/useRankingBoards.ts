import { Coins, Globe2, HeartHandshake, Share2, type IconNode } from 'lucide'
import type { ApiSuccess } from '~/types/api'
import type { AuthUser } from '~/services/auth'
import type { LeaderboardColumn } from '~/components/leaderboard/Table.vue'
import { useLeaderboard, type LeaderboardRow, type LeaderboardMeta } from '~/services/leaderboard'

/** Current value of the page-level filters, handed to a board's fetcher. */
export interface LeaderboardCtx {
  page: number
  registeredOnly: boolean
  region: string
}

/**
 * One ranking board. A board fully describes itself: how it looks in the nav
 * (`labelKey` + `icon`), which filters it supports (`region` / `registered`),
 * which columns it renders, and how to fetch its data. Adding a new board is a
 * single entry here — the page nav, filters and table all adapt.
 */
export interface LeaderboardBoard {
  key: string
  /** Message key for the nav label; resolved at render so it follows the locale. */
  labelKey: string
  /** Message key for the one-line subtitle shown in the board header. */
  descriptionKey: string
  icon: IconNode
  /** Pastel accent of the board's picker card (classes live in the page). */
  accent: 'violet' | 'sky' | 'pink'
  columns: LeaderboardColumn[]
  /** Show the region picker and pass `region` to `fetch`. */
  region?: boolean
  /** Show the registered-only toggle and pass `registeredOnly` to `fetch`. */
  registered?: boolean
  fetch: (ctx: LeaderboardCtx) => Promise<ApiSuccess<LeaderboardRow[], LeaderboardMeta>>
  /**
   * The signed-in user's rank on this board, or `null` when it isn't known
   * (e.g. registered-only, whose basis the profile ranks don't cover).
   */
  selfRank?: (user: AuthUser, ctx: LeaderboardCtx) => number | null
}

/**
 * The registry of available boards. Built inside a composable so each board's
 * `fetch` can close over the API instance. The page renders these in order.
 */
export function useRankingBoards(): LeaderboardBoard[] {
  const api = useLeaderboard()

  return [
    {
      key: 'points',
      labelKey: 'leaderboard.board.points.label',
      descriptionKey: 'leaderboard.board.points.description',
      icon: Coins,
      accent: 'violet',
      columns: ['rank', 'user', 'level', 'platinum', 'gold', 'silver', 'bronze', 'mix', 'points'],
      registered: true,
      fetch: ({ page, registeredOnly }) => api.points({ page, registered_only: registeredOnly }),
      selfRank: (user, { registeredOnly }) => (registeredOnly ? null : user.rank),
    },
    {
      key: 'points-region',
      labelKey: 'leaderboard.board.pointsRegion.label',
      descriptionKey: 'leaderboard.board.pointsRegion.description',
      icon: Globe2,
      accent: 'sky',
      columns: ['rank', 'user', 'level', 'platinum', 'gold', 'silver', 'bronze', 'mix', 'points'],
      region: true,
      registered: true,
      fetch: ({ page, registeredOnly, region }) =>
        api.pointsByRegion(region, { page, registered_only: registeredOnly }),
      // `server_rank` is the rank within the user's own region only.
      selfRank: (user, { registeredOnly, region }) =>
        (registeredOnly || user.country?.toUpperCase() !== region ? null : user.server_rank),
    },
    {
      key: 'tips',
      labelKey: 'leaderboard.board.tips.label',
      descriptionKey: 'leaderboard.board.tips.description',
      icon: HeartHandshake,
      accent: 'pink',
      columns: ['rank', 'user', 'tipCount', 'voteUp'],
      fetch: ({ page }) => api.tips({ page }),
    },
    {
      key: 'contribution',
      labelKey: 'leaderboard.board.contribution.label',
      descriptionKey: 'leaderboard.board.contribution.description',
      icon: Share2,
      accent: 'violet',
      columns: ['rank', 'user', 'contribution'],
      fetch: ({ page }) => api.contribution({ page }),
    },
  ]
}
