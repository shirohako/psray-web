import type { Size } from './ogImage'
import { fitWithin } from './ogImage'

/**
 * Social-card markup for the generated 1200×630 Open Graph images.
 *
 * Pure string building, deliberately free of Nitro globals so `tests/ogCard.test.ts`
 * can import it directly. The rendering pipeline lives in `ogRender.ts`.
 *
 * ## Text and scripts
 *
 * Most dynamic strings are ASCII: PSN IDs are `[A-Za-z0-9_-]`, platforms are
 * `PS5`/`PS4`/…, and the rest are numbers. The exception is a trophy set's name,
 * which arrives in whatever language the set defaults to — often Japanese. Rather
 * than bundle CJK outlines, `ogRender.ts` fetches a per-title subset font at
 * render time; see the note there.
 *
 * Satori only understands inline styles on a small CSS subset — no classes, no
 * shorthand `background`, and every flex container needs an explicit `display`.
 */

/** Social cards are always 2:1 at this size — the aspect every platform crops to. */
export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

/**
 * Trophy-tier accents, mirroring `trophyKinds` in `app/utils/profile.ts`. That
 * table stores Tailwind class names, which mean nothing to satori, so the hexes
 * are spelled out here: platinum→cyan-400, gold→amber-400, silver→slate-400,
 * bronze→orange-400. Keep the two in step.
 */
export const TIER_COLORS = {
  platinum: '#22d3ee',
  gold: '#fbbf24',
  silver: '#94a3b8',
  bronze: '#fb923c',
} as const

export type TierKey = keyof typeof TIER_COLORS

/** Tier order, platinum → bronze, matching how the site lists them everywhere. */
const TIERS: TierKey[] = ['platinum', 'gold', 'silver', 'bronze']

/**
 * Platform badge fills, mirroring `platformBadgeClass()` in `app/utils/profile.ts`
 * (PS5 stays near-black, the rest are distinct same-weight hues).
 */
const PLATFORM_COLORS: Record<string, string> = {
  PS5: '#0f172a',
  PS4: '#0284c7',
  PS3: '#0d9488',
  PSVITA: '#f43f5e',
  PSV: '#f43f5e',
  PSP: '#d97706',
}
const PLATFORM_FALLBACK = '#475569'

/*
 * Brand palette, sampled straight out of `public/images/psray-share.jpg` so the
 * generated cards read as the same family as the static one: a near-white ground
 * tinted blue toward the corner, a deep navy panel, and a blue→violet accent.
 */
const INK = '#0a1125'
const MUTED = '#64748b'
const HAIRLINE = '#e6eaf5'
const SURFACE = '#ffffff'
const GROUND_FROM = '#f9fafe'
const GROUND_TO = '#e6edff'
const NAVY_FROM = '#1b2450'
const NAVY_TO = '#0e1433'
const LAVENDER = '#b7cbfe'
const LAVENDER_DIM = '#8094c9'
const ACCENT_FROM = '#6d96ff'
const ACCENT_TO = '#9fa5fd'

/*
 * The two identity pills under the PSN ID. The level badge carries the blue, so
 * the region sits one step cooler and quieter beside it — the old grey-violet
 * read as muddy against the card's blue ground.
 */
const REGION_BADGE_BG = '#e8eef8'
const REGION_BADGE_INK = '#4a5a78'
const LEVEL_BADGE_BG = '#edf1ff'
const LEVEL_BADGE_INK = '#5f75ad'

/** Width of the navy stat panel; the light column takes whatever is left. */
const PANEL_W = 352

/** Same compact platform label the badges use on-site: `PSVITA` renders as `PSV`. */
export const platformLabel = (platform: string): string =>
  (platform === 'PSVITA' ? 'PSV' : platform)

/**
 * Trim a title to what fits two lines of the card's headline.
 *
 * Budgeted in ems rather than characters: a CJK glyph is about square, while a
 * Latin one is roughly half that, so `ライフ イズ ストレンジ` and `Life is Strange`
 * cost very different amounts of the same line.
 */
export function clampTitle(name: string, budget = 20): string {
  let used = 0
  let out = ''
  for (const char of name) {
    used += /[\u1100-\u11FF\u2E80-\u9FFF\uA960-\uA97F\uAC00-\uD7FF\uF900-\uFAFF\uFF00-\uFF60]/.test(char) ? 1 : 0.5
    if (used > budget) {
      const trimmed = out.trimEnd()
      // If a spaced title was cut inside a word, drop that partial word so the
      // ellipsis stays on the visible second line. CJK titles have no spaces and
      // continue to clamp glyph-by-glyph.
      const lastSpace = trimmed.lastIndexOf(' ')
      const visible = !out.endsWith(' ') && lastSpace > 0
        ? trimmed.slice(0, lastSpace)
        : trimmed
      return `${visible}…`
    }
    out += char
  }
  return out
}

/** Approximate horizontal space in ems, using the same model as `clampTitle`. */
const titleWeight = (name: string): number => Array.from(name).reduce((total, char) =>
  total + (/[ᄀ-ᇿ⺀-鿿ꥠ-꥿가-퟿豈-﫿＀-｠]/.test(char) ? 1 : 0.5), 0)

/** All set names run slightly smaller; exceptionally long ones step down again. */
export const trophyTitleSize = (name: string): number => titleWeight(name) > 20 ? 27 : 31

/** Smaller headlines can safely show more text before falling back to an ellipsis. */
const trophyTitleBudget = (fontSize: number): number => fontSize < 31 ? 30 : 25

/** Two lines of the headline, exactly — a third must not peek over the clip. */
const trophyTitleHeight = (fontSize: number): number => Math.round(fontSize * TITLE_LINE_HEIGHT * 2)

const TITLE_LINE_HEIGHT = 1.18

/**
 * `short` rather than the default: CLDR's short forms are exactly the ones a
 * badge wants — `HK` reads "Hong Kong" instead of "Hong Kong SAR China", and
 * `GB` reads "UK" instead of "United Kingdom".
 */
const englishRegionNames = new Intl.DisplayNames(['en'], { type: 'region', style: 'short' })

/** Where even the short form is not the name people use. */
const REGION_OVERRIDES: Record<string, string> = {
  US: 'USA',
  AE: 'UAE',
}

/**
 * Past this the label crowds the level badge beside it, and the flag has already
 * said which country this is — so the bare ISO code stands in. It only bites for
 * territories nobody holds a PSN account in ("South Georgia & South Sandwich
 * Islands"); real ones as long as "Dominican Republic" still spell themselves out.
 */
const REGION_MAX = 18

/** ISO country code → compact English label suitable for the identity row. */
export function cardRegionName(country: string | null): string {
  if (!country) return ''
  if (!/^[A-Za-z]{2}$/.test(country)) return country
  const code = country.toUpperCase()
  if (REGION_OVERRIDES[code]) return REGION_OVERRIDES[code]
  try {
    const name = englishRegionNames.of(code) ?? code
    return name.length > REGION_MAX ? code : name
  }
  catch {
    return code
  }
}

/** Absolute UTC date for cached cards; relative dates would become stale in-place. */
export function cardUpdatedDate(value: string | number | null | undefined): string | null {
  if (value == null || value === '') return null
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * Older PSN trophy sets often append a generic "Trophies" label to the game
 * name. The card already identifies itself as a trophy set, so keeping that
 * suffix wastes an entire headline line without adding information.
 */
export const trophyTitle = (name: string): string =>
  name.replace(/\s+(?:trophies|trophy set)$/i, '').trim()

/** Art the card draws: inlined bytes plus the intrinsic size to lay it out by. */
export interface CardImage {
  uri: string
  natural: Size | null
}

/** Thousands separators, fixed to `en-US` so the card never depends on server locale. */
export const num = (value: number): string => value.toLocaleString('en-US')

/** Satori has no HTML parser of its own; `satori-html` does, so escape our inputs. */
const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export interface TierCounts {
  platinum: number
  gold: number
  silver: number
  bronze: number
}

export interface ProfileCard {
  psnid: string
  trophyLevel: number
  /** Global PSRay leaderboard position. */
  rank: number | null
  /** Position within the player's PSN account region. */
  regionalRank: number | null
  trophies: TierCounts
  playedGames: number
  /** The PSN avatar, or `null` when it could not be fetched. */
  avatar: CardImage | null
  /** Data URI for the country flag — an SVG, so it scales — or `null`. */
  flag: string | null
  /** ISO 3166-1 alpha-2 PSN account country, used for its English label. */
  country: string | null
  /** Data URI for the PSRay gamepad mark — SVG where available — or `null`. */
  logo: string | null
  /** Canonical public profile page represented by this image. */
  url: string
  /** QR data URI for `url`, or `null` when generation failed. */
  qr: string | null
  /** Last successful public trophy sync; omitted until one has completed. */
  lastUpdatedAt: string | number | null
}

export interface TrophyCard {
  /** The set's name in its own default language — drawn as the card's title. */
  name: string
  platforms: string[]
  trophies: TierCounts
  owners: number
  completedPlayers: number
  platinumAchievers: number
  recentPlayers: number
  /** Average completion across owners, 0–100. */
  averageProgress: number
  /** The trophy-set icon, or `null` when it could not be fetched. */
  icon: CardImage | null
  /** Data URI for the PSRay gamepad mark — SVG where available — or `null`. */
  logo: string | null
  /** Canonical public trophy-set page represented by this image. */
  url: string
  /** QR data URI for `url`, or `null` when generation failed. */
  qr: string | null
  /** When the set's stats were last refreshed; omitted when unknown. */
  lastUpdatedAt: string | number | null
}

/**
 * The card frame: a light gradient canvas on the left and a deep navy overview
 * panel on the right. Soft ambient shapes keep the large empty surfaces from
 * feeling flat without competing with the dynamic content.
 */
const shell = (left: string, panel: string): string => `
  <div style="display:flex;position:relative;overflow:hidden;width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;background-image:linear-gradient(135deg,${GROUND_FROM} 0%,${GROUND_FROM} 54%,${GROUND_TO} 100%);font-family:Inter;">
    <div style="display:flex;position:absolute;width:430px;height:430px;border-radius:215px;left:-190px;bottom:-300px;background-color:#d9e5ff;opacity:0.48;"></div>
    <div style="display:flex;position:absolute;width:310px;height:310px;border-radius:155px;right:252px;top:-220px;background-color:#dce6ff;opacity:0.56;"></div>
    <div style="display:flex;position:relative;flex-direction:column;width:${CARD_WIDTH - PANEL_W}px;padding:42px 52px 42px 56px;">
      ${left}
    </div>
    <div style="display:flex;position:relative;flex-direction:column;width:${PANEL_W}px;padding:44px 42px 40px;background-image:linear-gradient(160deg,${NAVY_FROM} 0%,${NAVY_TO} 100%);border-radius:56px 0 0 56px;box-shadow:-18px 0 42px rgba(28,43,91,0.12);">
      ${panel}
    </div>
  </div>`

/** The blue→violet rule the brand art uses as its accent mark. */
const accentBar = (width = 72): string => `
  <div style="display:flex;width:${width}px;height:6px;border-radius:3px;background-image:linear-gradient(90deg,${ACCENT_FROM},${ACCENT_TO});"></div>`

/** The dot lattice scattered through the brand art, echoed on the navy panel. */
const dotGrid = (cols: number, rows: number): string => `
  <div style="display:flex;flex-direction:column;">
    ${Array.from({ length: rows }, () => `
      <div style="display:flex;margin-bottom:11px;">
        ${Array.from({ length: cols }, () => `<div style="display:flex;width:6px;height:6px;border-radius:3px;background-color:${LAVENDER};opacity:0.34;margin-right:12px;"></div>`).join('')}
      </div>`).join('')}
  </div>`

/** One tier: a colour dot beside its count, with the tier name underneath. */
const tierBlock = (tier: TierKey, count: number, index: number): string => `
  <div style="display:flex;flex-direction:column;width:25%;padding:0 14px;${index ? `border-left:1px solid ${HAIRLINE};` : ''}">
    <div style="display:flex;align-items:center;">
      <div style="display:flex;width:13px;height:13px;border-radius:7px;background-color:${TIER_COLORS[tier]};margin-right:9px;box-shadow:0 0 0 5px ${TIER_COLORS[tier]}22;"></div>
      <div style="display:flex;font-size:30px;font-weight:600;color:${INK};letter-spacing:-0.5px;">${num(count)}</div>
    </div>
    <div style="display:flex;font-size:17px;color:${MUTED};margin-top:5px;text-transform:capitalize;">${tier}</div>
  </div>`

/**
 * The four tiers on a floating white card — the same raised surface the brand
 * image layers over its background.
 */
const tierCard = (t: TierCounts): string => `
  <div style="display:flex;align-items:center;height:116px;padding:20px 18px;border:1px solid ${HAIRLINE};border-radius:24px;background-color:${SURFACE};box-shadow:0 18px 42px rgba(13,23,64,0.08);">
    ${TIERS.map((tier, index) => tierBlock(tier, t[tier], index)).join('')}
  </div>`

/**
 * Art scaled to fill a box without distorting, on a frame that then shrinks to
 * the art plus an even `padding` on every side.
 *
 * Trophy-set art is not one shape: PS5 sets ship a 512×512 square, everything
 * older a 320×176 landscape. Bounding both with the *same* frame left a PS4 cover
 * floating in 30-odd pixels of white above and below, so the frame is derived
 * from the fitted art rather than fixed ahead of it. `maxWidth`/`maxHeight` cap
 * how large the art itself may be drawn.
 */
const artTile = (
  image: CardImage | null,
  maxWidth: number,
  maxHeight: number,
  padding: number,
  radius: number,
): string => {
  const { width, height } = fitWithin(image?.natural ?? null, maxWidth, maxHeight)
  // Concentric with the frame: an outer corner of `radius` set back by `padding`
  // leaves exactly this much curve on the art inside it.
  const innerRadius = Math.max(12, radius - padding)
  const art = image
    ? `<img src="${image.uri}" width="${width}" height="${height}" style="width:${width}px;height:${height}px;border-radius:${innerRadius}px;" />`
    : `<div style="display:flex;width:${width}px;height:${height}px;border-radius:${innerRadius}px;background-image:linear-gradient(135deg,#e4eaff,#cbd8f8);"></div>`

  return `<div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:${width + padding * 2}px;height:${height + padding * 2}px;border:1px solid ${HAIRLINE};border-radius:${radius}px;background-color:${SURFACE};box-shadow:0 18px 42px rgba(13,23,64,0.11);overflow:hidden;">${art}</div>`
}

/**
 * A compact top-left brand lockup. The content type belongs with the subject's
 * subtitle instead of competing with the PSRay wordmark.
 *
 * The mark is drawn at 64 rather than 48. Its artwork is wide and short — the ink
 * fills the square canvas across but only the middle two thirds down — so at 48
 * it stood barely 33px tall beside a 30px wordmark, and the outline's tapers were
 * landing on half a pixel. The taller box costs nothing: the empty top and bottom
 * of the canvas simply read as the lockup's breathing room.
 */
const cardHeader = (logo: string | null): string => `
  <div style="display:flex;align-items:center;height:64px;">
    ${logo ? `<img src="${logo}" width="64" height="64" style="width:64px;height:64px;margin-right:12px;" />` : ''}
    <div style="display:flex;font-size:30px;font-weight:600;color:${INK};letter-spacing:-0.7px;">PSRay</div>
    <div style="display:flex;height:27px;margin-left:17px;padding-left:17px;border-left:1px solid #d7ddeb;align-items:center;font-size:15px;color:${MUTED};letter-spacing:0.1px;">Your PSN assistant</div>
  </div>`

/** Concrete destination and a scannable QR, anchored to the light column's footer. */
const cardLink = (url: string, qr: string | null, lastUpdatedAt?: string | number | null): string => {
  const updated = cardUpdatedDate(lastUpdatedAt)
  return `
  <div style="display:flex;align-items:center;height:84px;margin-top:12px;">
    ${qr ? `<div style="display:flex;width:84px;height:84px;padding:5px;border:1px solid ${HAIRLINE};border-radius:12px;background-color:#ffffff;box-shadow:0 8px 24px rgba(13,23,64,0.07);"><img src="${qr}" width="72" height="72" style="width:72px;height:72px;" /></div>` : ''}
    <div style="display:flex;flex-direction:column;${qr ? 'margin-left:15px;' : ''}">
      <div style="display:flex;font-size:11px;font-weight:600;color:#8793ad;letter-spacing:1.2px;text-transform:uppercase;">Open on PSRay</div>
      <div style="display:flex;font-size:17px;font-weight:500;color:#33415f;margin-top:${updated ? 5 : 7}px;letter-spacing:-0.15px;">${esc(url)}</div>
      ${updated ? `<div style="display:flex;font-size:12px;color:#8793ad;margin-top:5px;">Last updated ${updated}</div>` : ''}
    </div>
  </div>`
}

const panelFooter = (): string => `
  <div style="display:flex;align-items:center;margin-top:auto;">
    <div style="display:flex;width:28px;height:3px;border-radius:2px;background-image:linear-gradient(90deg,${ACCENT_FROM},${ACCENT_TO});margin-right:11px;"></div>
    <div style="display:flex;font-size:17px;color:${LAVENDER_DIM};letter-spacing:0.4px;">psray.net</div>
  </div>`

const panelHeading = (label: string): string => `
  <div style="display:flex;align-items:flex-start;justify-content:space-between;">
    <div style="display:flex;font-size:14px;font-weight:600;color:${LAVENDER};letter-spacing:1.6px;text-transform:uppercase;">${label}</div>
    ${dotGrid(4, 2)}
  </div>`

type MetricIcon = 'globe' | 'pin' | 'trophy' | 'gamepad' | 'users' | 'check' | 'award' | 'activity' | 'percent'

const ICON_PATHS: Record<MetricIcon, string> = {
  globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3c2.3 2.5 3.5 5.5 3.5 9s-1.2 6.5-3.5 9c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3z"></path>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"></path><circle cx="12" cy="10" r="2.5"></circle>',
  trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4z"></path><path d="M8 6H5v1a4 4 0 0 0 4 4"></path><path d="M16 6h3v1a4 4 0 0 1-4 4"></path><path d="M12 12v5"></path><path d="M8 20h8"></path><path d="M10 17h4"></path>',
  gamepad: '<path d="M7 8h10a4 4 0 0 1 3.8 3l1 4a3 3 0 0 1-5 2.8L15 16H9l-1.8 1.8a3 3 0 0 1-5-2.8l1-4A4 4 0 0 1 7 8z"></path><path d="M6 12h4"></path><path d="M8 10v4"></path><circle cx="16" cy="12" r=".7" fill="currentColor" stroke="none"></circle><circle cx="18" cy="14" r=".7" fill="currentColor" stroke="none"></circle>',
  users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"></path><circle cx="9.5" cy="7" r="3.5"></circle><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8"></path><path d="M18 14.5a4 4 0 0 1 3 3.9V20"></path>',
  check: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.5 2.5L16.5 9"></path>',
  award: '<circle cx="12" cy="9" r="5"></circle><path d="m8.5 13-1 8 4.5-2.5 4.5 2.5-1-8"></path>',
  activity: '<path d="M3 12h4l2-6 4 12 2-6h6"></path>',
  percent: '<path d="m6 18 12-12"></path><circle cx="7" cy="7" r="2"></circle><circle cx="17" cy="17" r="2"></circle>',
}

/** Inline line icons avoid an icon-font dependency in the Satori renderer. */
const metricIcon = (name: MetricIcon): string => `
  <div style="display:flex;align-items:center;justify-content:center;width:25px;height:25px;border-radius:7px;background-color:rgba(183,203,254,0.12);color:${LAVENDER};">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;">${ICON_PATHS[name]}</svg>
  </div>`

const levelIcon = (): string => `
  <div style="display:flex;align-items:center;justify-content:center;color:#6582e8;margin-right:7px;">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:19px;height:19px;">${ICON_PATHS.award}</svg>
  </div>`

const levelBadge = (level: number): string => `
  <div style="display:flex;align-items:center;height:32px;padding:0 11px;border-radius:9px;background-color:${LEVEL_BADGE_BG};color:${LEVEL_BADGE_INK};">
    ${levelIcon()}
    <div style="display:flex;font-size:18px;font-weight:500;">Level ${num(level)}</div>
  </div>`

interface PanelMetric {
  value: string
  label: string
  icon: MetricIcon
}

/** One equal-weight data card; large values scale down before they can overflow. */
const panelMetric = ({ value, label, icon }: PanelMetric): string => {
  const size = value.length > 8 ? 21 : value.length > 6 ? 24 : 28
  return `
    <div style="display:flex;position:relative;flex-direction:column;width:128px;height:96px;padding:13px 13px 12px;border:1px solid rgba(183,203,254,0.16);border-radius:17px;background-color:rgba(255,255,255,0.06);">
      <div style="display:flex;position:absolute;right:12px;top:12px;">
        ${metricIcon(icon)}
      </div>
      <div style="display:flex;width:76px;font-size:10px;font-weight:600;color:${LAVENDER};letter-spacing:0.75px;text-transform:uppercase;line-height:1.15;">${label}</div>
      <div style="display:flex;font-size:${size}px;font-weight:600;color:#ffffff;letter-spacing:-0.6px;margin-top:auto;">${value}</div>
    </div>`
}

const metricGrid = (metrics: PanelMetric[]): string => `
  <div style="display:flex;flex-wrap:wrap;width:268px;">
    ${metrics.map((metric, index) => `<div style="display:flex;${index % 2 ? 'margin-left:12px;' : ''}${index >= 2 ? 'margin-top:12px;' : ''}">${panelMetric(metric)}</div>`).join('')}
  </div>`

const sumTiers = (t: TierCounts): number => t.platinum + t.gold + t.silver + t.bronze

/**
 * Player card: avatar and identity on the light column, lifetime totals on the
 * navy panel, the four tiers on a floating card between them.
 *
 * Everything drawn here is public profile data — callers must refuse private ones.
 */
export function profileCardHtml(card: ProfileCard): string {
  const region = cardRegionName(card.country)
  // 26×20 outside the 1px border leaves a 24×18 content box: the exact 4:3 the
  // flag art is drawn at, so it fills the frame instead of being letterboxed
  // inside it. The bytes stay SVG — see `fetchImage` — so the shape is drawn at
  // the card's own resolution rather than resampled from a small raster.
  const flag = card.flag
    ? `<img src="${card.flag}" width="26" height="20" style="width:26px;height:20px;border:1px solid #dce8e4;border-radius:3px;${region ? 'margin-right:7px;' : ''}background-color:#ffffff;" />`
    : ''
  const regionBadge = flag || region
    ? `<div style="display:flex;align-items:center;height:32px;padding:0 10px;border-radius:9px;background-color:${REGION_BADGE_BG};color:${REGION_BADGE_INK};margin-right:9px;">${flag}${region ? `<div style="display:flex;font-size:16px;font-weight:500;">${esc(region)}</div>` : ''}</div>`
    : ''

  const left = `
    ${cardHeader(card.logo)}
    <div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;">
    <div style="display:flex;align-items:center;margin-top:8px;">
      ${artTile(card.avatar, 174, 174, 5, 22)}
      <div style="display:flex;flex-direction:column;flex-grow:1;flex-shrink:1;margin-left:34px;">
        <div style="display:flex;font-size:14px;font-weight:600;color:${MUTED};letter-spacing:1.5px;text-transform:uppercase;">Player profile</div>
        <div style="display:flex;margin-top:10px;">
        ${accentBar(64)}
        </div>
        <div style="display:flex;font-size:52px;font-weight:600;color:${INK};letter-spacing:-1.2px;margin-top:11px;">${esc(card.psnid)}</div>
        <div style="display:flex;align-items:center;margin-top:11px;">
          ${regionBadge}
          ${levelBadge(card.trophyLevel)}
        </div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;margin-top:32px;">
      ${tierCard(card.trophies)}
    </div>
    </div>
    ${cardLink(card.url, card.qr, card.lastUpdatedAt)}`

  const panel = `
    ${panelHeading('Player overview')}
    <div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;margin-top:8px;">
      ${metricGrid([
        { value: card.rank == null ? '—' : `#${num(card.rank)}`, label: 'Global rank', icon: 'globe' },
        { value: card.regionalRank == null ? '—' : `#${num(card.regionalRank)}`, label: 'Regional rank', icon: 'pin' },
        { value: num(sumTiers(card.trophies)), label: 'Trophies', icon: 'trophy' },
        { value: num(card.playedGames), label: 'Games played', icon: 'gamepad' },
      ])}
    </div>
    ${panelFooter()}`

  return shell(left, panel)
}

/**
 * Trophy-set card: cover art, title and platforms on the light column, with
 * completion and ownership context on the navy panel.
 */
export function trophyCardHtml(card: TrophyCard): string {
  const title = trophyTitle(card.name)
  const titleSize = trophyTitleSize(title)
  const badges = card.platforms.map((platform) => {
    const label = platformLabel(platform)
    const fill = PLATFORM_COLORS[platform] ?? PLATFORM_FALLBACK
    // Deliberately small: the platform is a qualifier on the title, not a headline
    // of its own, and at 34px tall it was reading as loud as the set's name.
    return `<div style="display:flex;align-items:center;height:24px;padding:0 9px;margin-right:7px;border-radius:7px;background-color:${fill};color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.2px;">${esc(label)}</div>`
  }).join('')

  const left = `
    ${cardHeader(card.logo)}
    <div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;">
    <div style="display:flex;align-items:center;margin-top:8px;">
      ${artTile(card.icon, 258, 180, 5, 22)}
      <div style="display:flex;flex-direction:column;flex-grow:1;flex-shrink:1;margin-left:32px;">
        <div style="display:flex;font-size:13px;font-weight:600;color:${MUTED};letter-spacing:1.4px;text-transform:uppercase;">Trophy set</div>
        <div style="display:flex;margin-top:10px;">
        ${accentBar(64)}
        </div>
        <div style="display:flex;width:364px;max-height:${trophyTitleHeight(titleSize)}px;overflow:hidden;font-size:${titleSize}px;font-weight:600;color:${INK};letter-spacing:-0.5px;line-height:${TITLE_LINE_HEIGHT};margin-top:11px;">${esc(clampTitle(title, trophyTitleBudget(titleSize)))}</div>
        <div style="display:flex;align-items:center;margin-top:14px;">
          ${badges}
        </div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;margin-top:32px;">
      ${tierCard(card.trophies)}
    </div>
    </div>
    ${cardLink(card.url, card.qr, card.lastUpdatedAt)}`

  const panel = `
    ${panelHeading('Overview')}
    <div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;margin-top:8px;">
      ${metricGrid([
        { value: num(sumTiers(card.trophies)), label: 'Trophies', icon: 'trophy' },
        { value: num(card.owners), label: 'Owners', icon: 'users' },
        { value: num(card.completedPlayers), label: 'Completed', icon: 'check' },
        { value: num(card.platinumAchievers), label: 'Platinum', icon: 'award' },
        { value: num(card.recentPlayers), label: 'Recent', icon: 'activity' },
        { value: `${Math.round(card.averageProgress)}%`, label: 'Avg progress', icon: 'percent' },
      ])}
    </div>
    ${panelFooter()}`

  return shell(left, panel)
}
