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



/**
 * Colour families of the drawn cover. Each game takes one family, so a cover
 * stays within one hue: a pale background, the big symbol a step deeper, its
 * texture and the top band deeper again, the title and line work dark. All
 * flat colours, at OKLCH lightness .945 / .84 / .75 / .79 / .36 so every family
 * sits at the same depth. Lavender, pink and blue are the hues of the palette
 * cdb4db-ffc8dd-ffafcc-bde0fe-a2d2ff; the rest are matched to them.
 */
const COVER_FAMILIES = [
  { bg: '#f4e7fc', shape: '#dcbdee', accent: '#c49bdb', band: '#ceabe2', text: '#4b3059' }, // lavender
  { bg: '#fee5ee', shape: '#f3b7cd', accent: '#e193b1', band: '#e7a4bd', text: '#5b2b3f' }, // pink
  { bg: '#ddefff', shape: '#a3d0f9', accent: '#77b4ea', band: '#8dc0ee', text: '#154062' }, // blue
  { bg: '#dbf4e8', shape: '#9cdbbe', accent: '#6cc29e', band: '#85ccad', text: '#014933' }, // mint
  { bg: '#fde9d9', shape: '#f0c099', accent: '#dd9f6b', band: '#e3ae83', text: '#59320c' }, // peach
  { bg: '#d7f3f6', shape: '#8ed9e2', accent: '#53c0cc', band: '#74cbd4', text: '#004850' }, // aqua
  { bg: '#eaebff', shape: '#c5c4fa', accent: '#a7a5eb', band: '#b4b3f0', text: '#393763' }, // lilac
  { bg: '#ffe5e4', shape: '#f8b8b5', accent: '#e79491', band: '#eca5a2', text: '#5e2b2b' }, // coral
] as const

export type CoverShape = 'circle' | 'triangle' | 'square' | 'cross'
const COVER_SHAPES: CoverShape[] = ['circle', 'triangle', 'square', 'cross']

/**
 * Compositions of the drawn cover (see `GameCoverArt`): one big textured
 * symbol, a ringed planet, the four face buttons, a sunburst, a retro sunset
 * over a grid, or a wallpaper of small symbols.
 */
export type CoverLayout = 'hero' | 'planet' | 'buttons' | 'burst' | 'sunset' | 'tiles'
export const COVER_LAYOUTS: CoverLayout[] = ['hero', 'planet', 'buttons', 'burst', 'sunset', 'tiles']

/** Places for the small scattered symbols on the 300 × 400 canvas, clear of the title. */
const SPRINKLE_SLOTS = [[34, 214], [128, 196], [272, 182], [42, 372], [104, 300], [262, 262]] as const

export interface CoverArt {
  bg: string
  /** Fill of the big symbol. */
  shape: string
  /** Second colour of the big symbol's texture. */
  accent: string
  /** Band across the top, and the second surface of a layout (rings, ground, button pad). */
  band: string
  /** Title and line work: the offset outline, the small symbols, the dot grid. */
  text: string
  layout: CoverLayout
  /** The layout's main symbol. */
  big: CoverShape
  /** Pattern inside the main surface: the big symbol, the planet, the sun. */
  texture: 'solid' | 'stripes' | 'dots'
  /** Tilt of the main symbol or group, in degrees. */
  tilt: number
  /** Small outlined symbols scattered around (big symbol, planet, sunset). */
  sprinkles: { shape: CoverShape, x: number, y: number, r: number }[]
  /** Which face button (0–3: △ ○ × □) is drawn pressed. */
  pressed: number
  /** Tiles drawn highlighted in the wallpaper layout (indices into its 5 × 4 grid). */
  highlights: number[]
}

/**
 * The drawn cover of a game without cover art, chosen from `seed` (the game
 * id) so a game always gets the same cover, in every language.
 */
export function coverArt(seed: number | string): CoverArt {
  let state = 0
  for (const char of String(seed)) state = Math.imul(state ^ char.codePointAt(0)!, 0x9E3779B1) >>> 0
  // mulberry32: a small seeded generator, so each choice gets fresh bits.
  const random = () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), state | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!

  const big = pick(COVER_SHAPES)
  // Fisher–Yates rather than `sort(random)`: engines sort differently, and SSR must match the browser.
  const slots = [...SPRINKLE_SLOTS]
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j]!, slots[i]!]
  }
  slots.length = 2 + Math.floor(random() * 2)
  return {
    ...pick(COVER_FAMILIES),
    layout: pick(COVER_LAYOUTS),
    big,
    texture: pick(['solid', 'stripes', 'dots'] as const),
    tilt: pick([-14, -6, 0, 8, 15]),
    sprinkles: slots.map(([x, y]) => ({
      shape: pick(COVER_SHAPES.filter(item => item !== big)),
      x,
      y,
      r: 9 + Math.floor(random() * 9),
    })),
    pressed: Math.floor(random() * 4),
    highlights: [Math.floor(random() * 10), 10 + Math.floor(random() * 10)],
  }
}

/** SVG path of a face-button symbol centred on (`x`, `y`) with radius `r`. The cross is meant to be stroked. */
export function coverShapePath(shape: CoverShape, x: number, y: number, r: number): string {
  switch (shape) {
    case 'circle': return `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
    case 'triangle': return `M${x} ${y - r}L${x + r * 0.866} ${y + r / 2}L${x - r * 0.866} ${y + r / 2}Z`
    case 'square': return `M${x - r * 0.8} ${y - r * 0.8}h${r * 1.6}v${r * 1.6}h${-r * 1.6}Z`
    case 'cross': {
      const h = r * 0.7
      return `M${x - h} ${y - h}L${x + h} ${y + h}M${x + h} ${y - h}L${x - h} ${y + h}`
    }
  }
}
