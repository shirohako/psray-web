import { Award, CalendarDays, FileText, Gem, GalleryHorizontal, Heart, Image, Images, MessageSquare, Users, type IconNode } from 'lucide'
import type { Profile, ProfileShowcases, ShowcaseColumn, ShowcaseGame, ShowcaseKey, ShowcaseLayout, ShowcaseText, ShowcaseTrophy } from '~/services/profile'
import type { Screenshot } from '~/services/screenshots'
import type { TrophyType } from '~/services/trophies'

/**
 * Profile showcases: the cards an owner can switch off and reorder within
 * their column (registry and layout rules live in the API's
 * `App\Support\ProfileShowcases`). The tabbed main card, stats and account
 * cards are fixed and not showcases.
 */

/** Most trophies a featured showcase holds. */
export const FEATURED_LIMIT = 12

/** Most games the favorite-games showcase holds. */
export const GAMES_LIMIT = 6

/** Most screenshots the favorite-screenshots showcase holds. */
export const FAVORITE_SCREENSHOTS_LIMIT = 6

/** Character limits of a text showcase (the API counts characters, not bytes). */
export const TEXT_TITLE_MAX = 40
export const TEXT_BODY_MAX = 5000

/** The text showcase of each column. */
export const TEXT_KEYS = { left: 'text_left', right: 'text_right' } as const satisfies Record<ShowcaseColumn, ShowcaseKey>

/** Settings labels and icon per showcase; `i18n` keys under `settings.showcase.items`. */
export const SHOWCASE_META: Record<ShowcaseKey, { icon: IconNode, labelKey: string, descKey: string }> = {
  calendar: { icon: CalendarDays, labelKey: 'settings.showcase.items.calendar.name', descKey: 'settings.showcase.items.calendar.desc' },
  rarest: { icon: Gem, labelKey: 'settings.showcase.items.rarest.name', descKey: 'settings.showcase.items.rarest.desc' },
  featured: { icon: Award, labelKey: 'settings.showcase.items.featured.name', descKey: 'settings.showcase.items.featured.desc' },
  games: { icon: Heart, labelKey: 'settings.showcase.items.games.name', descKey: 'settings.showcase.items.games.desc' },
  text_left: { icon: FileText, labelKey: 'settings.showcase.items.text_left.name', descKey: 'settings.showcase.items.text_left.desc' },
  text_right: { icon: FileText, labelKey: 'settings.showcase.items.text_right.name', descKey: 'settings.showcase.items.text_right.desc' },
  tips: { icon: MessageSquare, labelKey: 'settings.showcase.items.tips.name', descKey: 'settings.showcase.items.tips.desc' },
  social: { icon: Users, labelKey: 'settings.showcase.items.social.name', descKey: 'settings.showcase.items.social.desc' },
  favorite_screenshots: { icon: GalleryHorizontal, labelKey: 'settings.showcase.items.favorite_screenshots.name', descKey: 'settings.showcase.items.favorite_screenshots.desc' },
  screenshots: { icon: Images, labelKey: 'settings.showcase.items.screenshots.name', descKey: 'settings.showcase.items.screenshots.desc' },
  share_card: { icon: Image, labelKey: 'settings.showcase.items.share_card.name', descKey: 'settings.showcase.items.share_card.desc' },
}

/**
 * The showcases a profile renders. Responses from before showcases existed
 * have no `showcases`: fall back to the old fixed cards (calendar on the
 * left, comments and social on the right) so the page still shows them.
 * Like the API, comments only show once there is one.
 */
export function resolveShowcases(profile: Pick<Profile, 'showcases' | 'calendar' | 'recent_tips'>): ProfileShowcases {
  if (profile.showcases) return profile.showcases
  return {
    left: profile.calendar?.length ? ['calendar'] : [],
    right: profile.recent_tips?.length ? ['tips', 'social'] : ['social'],
  }
}

/** A copy of `list` with the item at `from` moved to `to` (indices clamped). */
export function moveIndex<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list]
  if (from < 0 || from >= next.length) return next
  const target = Math.max(0, Math.min(next.length - 1, to))
  const [item] = next.splice(from, 1)
  next.splice(target, 0, item as T)
  return next
}

/** Deep copy, so the form can be edited without touching the saved state. */
export function cloneLayout(layout: ShowcaseLayout): ShowcaseLayout {
  return {
    left: layout.left.map(slot => ({ ...slot })),
    right: layout.right.map(slot => ({ ...slot })),
  }
}

export function sameLayout(a: ShowcaseLayout, b: ShowcaseLayout): boolean {
  const same = (x: ShowcaseLayout['left'], y: ShowcaseLayout['left']) =>
    x.length === y.length && x.every((slot, i) => slot.key === y[i]?.key && slot.on === y[i]?.on)
  return same(a.left, b.left) && same(a.right, b.right)
}

/** A featured-trophy pick as the settings form and picker hold it. */
export interface PickedTrophy {
  trophy_set_id: number
  trophy_id: number
  name: string
  icon_url: string
  type: TrophyType
  psn_earned_rate: number | string
  set_name: string
  /** Language `name` is in, for `lang`. */
  display_language: string | null
}

export function toPicked(item: ShowcaseTrophy): PickedTrophy {
  return {
    trophy_set_id: item.trophy_set_id,
    trophy_id: item.trophy_id,
    name: item.trophy.name,
    icon_url: item.trophy.icon_url,
    type: item.trophy.type,
    psn_earned_rate: item.trophy.psn_earned_rate,
    set_name: item.trophy_set.name,
    display_language: item.trophy.display_language,
  }
}

/** What `PATCH /user/setting` stores for the featured showcase. */
export function featuredRefs(picks: readonly PickedTrophy[]) {
  return picks.map(p => ({ trophy_set_id: p.trophy_set_id, trophy_id: p.trophy_id }))
}

export function samePicks(a: readonly PickedTrophy[], b: readonly PickedTrophy[]): boolean {
  return a.length === b.length && a.every((p, i) => p.trophy_id === b[i]?.trophy_id)
}

/**
 * The layout after a showcase's content changes: filling an empty showcase
 * (the first trophy or game picked, the first text written) switches it on,
 * since an empty one never shows anyway. Anything else leaves the switch
 * where the owner put it.
 */
export function layoutAfterFilling(layout: ShowcaseLayout, key: ShowcaseKey, wasEmpty: boolean, isEmpty: boolean): ShowcaseLayout {
  if (!wasEmpty || isEmpty) return layout
  const on = (slots: ShowcaseLayout['left']) => slots.map(slot => (slot.key === key ? { ...slot, on: true } : slot))
  return { left: on(layout.left), right: on(layout.right) }
}

/** A favorite-game pick as the settings form and picker hold it. */
export type PickedGame = ShowcaseGame

export function sameGames(a: readonly PickedGame[], b: readonly PickedGame[]): boolean {
  return a.length === b.length && a.every((g, i) => g.id === b[i]?.id)
}

/** A favorite-screenshot pick as the settings form and picker hold it. */
export type PickedScreenshot = Screenshot

export function sameScreenshots(a: readonly PickedScreenshot[], b: readonly PickedScreenshot[]): boolean {
  return a.length === b.length && a.every((s, i) => s.id === b[i]?.id)
}

export function sameTexts(a: Record<ShowcaseColumn, ShowcaseText>, b: Record<ShowcaseColumn, ShowcaseText>): boolean {
  return (['left', 'right'] as const).every(c => a[c].title === b[c].title && a[c].body === b[c].body)
}

/** Length as the API counts it: characters (code points), so a kanji or emoji is one. */
export function textLength(value: string): number {
  return Array.from(value).length
}

/** PSN rate as `"0.4%"`, or an em dash when unknown. */
export function formatPsnRate(rate: number | string): string {
  const value = Number(rate)
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : '—'
}
