/**
 * Social-card markup for the generated 1200×630 Open Graph images.
 *
 * Pure string building, deliberately free of Nitro globals so `tests/ogCard.test.ts`
 * can import it directly. The rendering pipeline lives in `ogRender.ts`.
 *
 * ## Why the cards carry no game or player prose
 *
 * Every dynamic string here is ASCII: PSN IDs are `[A-Za-z0-9_-]`, platforms are
 * `PS5`/`PS4`/…, and everything else is a number. Trophy-set names are not drawn
 * at all — they arrive in up to 25 PSN languages, and rendering those would mean
 * shipping 10–16MB of CJK outlines to satori for text that Telegram, X and Discord
 * already print, localised, in the card's own title line.
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

/** Width of the navy stat panel; the light column takes whatever is left. */
const PANEL_W = 372

/** Same compact platform label the badges use on-site: `PSVITA` renders as `PSV`. */
export const platformLabel = (platform: string): string =>
  (platform === 'PSVITA' ? 'PSV' : platform)

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
  rank: number | null
  trophies: TierCounts
  playedGames: number
  /** Data URI for the PSN avatar, or `null` when it could not be fetched. */
  avatar: string | null
  /** Data URI for the country flag, or `null` — always best-effort. */
  flag: string | null
}

export interface TrophyCard {
  platforms: string[]
  trophies: TierCounts
  owners: number
  /** Average completion across owners, 0–100. */
  averageProgress: number
  /** Data URI for the trophy-set icon, or `null` when it could not be fetched. */
  icon: string | null
}

/**
 * The card frame: a light gradient column on the left, the navy stat panel on the
 * right — the two surfaces the brand image is built from.
 */
const shell = (left: string, panel: string): string => `
  <div style="display:flex;width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;background-image:linear-gradient(135deg,${GROUND_FROM} 0%,${GROUND_FROM} 45%,${GROUND_TO} 100%);font-family:Inter;">
    <div style="display:flex;flex-direction:column;width:${CARD_WIDTH - PANEL_W}px;padding:52px 48px 44px 56px;">
      ${left}
    </div>
    <div style="display:flex;flex-direction:column;width:${PANEL_W}px;padding:52px 48px 44px;background-image:linear-gradient(160deg,${NAVY_FROM} 0%,${NAVY_TO} 100%);border-radius:56px 0 0 56px;">
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
      <div style="display:flex;margin-bottom:14px;">
        ${Array.from({ length: cols }, () => `<div style="display:flex;width:7px;height:7px;border-radius:4px;background-color:${LAVENDER};opacity:0.28;margin-right:14px;"></div>`).join('')}
      </div>`).join('')}
  </div>`

/** One tier: a colour dot beside its count, with the tier name underneath. */
const tierBlock = (tier: TierKey, count: number): string => `
  <div style="display:flex;flex-direction:column;">
    <div style="display:flex;align-items:center;">
      <div style="display:flex;width:16px;height:16px;border-radius:8px;background-color:${TIER_COLORS[tier]};margin-right:11px;"></div>
      <div style="display:flex;font-size:36px;font-weight:600;color:${INK};">${num(count)}</div>
    </div>
    <div style="display:flex;font-size:19px;color:${MUTED};margin-top:2px;text-transform:capitalize;">${tier}</div>
  </div>`

/**
 * The four tiers on a floating white card — the same raised surface the brand
 * image layers over its background.
 */
const tierCard = (t: TierCounts): string => `
  <div style="display:flex;justify-content:space-between;padding:26px 32px;border-radius:24px;background-color:${SURFACE};box-shadow:0 18px 40px rgba(13,23,64,0.08);">
    ${TIERS.map(tier => tierBlock(tier, t[tier])).join('')}
  </div>`

/** A rounded art tile, or a neutral placeholder of the same size when the fetch failed. */
const artTile = (src: string | null, size: number, radius: number): string =>
  (src
    ? `<img src="${src}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:${radius}px;box-shadow:0 16px 36px rgba(13,23,64,0.16);" />`
    : `<div style="display:flex;width:${size}px;height:${size}px;border-radius:${radius}px;background-color:#dfe6f7;"></div>`)

/** A headline figure on the navy panel: big white number over a lavender caption. */
const panelStat = (value: string, label: string, size = 62): string => `
  <div style="display:flex;flex-direction:column;">
    <div style="display:flex;font-size:${size}px;font-weight:600;color:#ffffff;letter-spacing:-1px;">${value}</div>
    <div style="display:flex;font-size:20px;color:${LAVENDER};margin-top:2px;">${label}</div>
  </div>`

/** Centres the light column's content as one block, rather than pooling the
 *  slack between the last card and the wordmark. */
const stack = (body: string): string => `
  <div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;">
    ${body}
  </div>`

/** Wordmark on the light column; the domain rides the foot of the navy panel. */
const wordmark = (): string => `
  <div style="display:flex;align-items:center;margin-top:auto;">
    <div style="display:flex;font-size:30px;font-weight:600;color:${INK};letter-spacing:-0.5px;">PSRay</div>
  </div>`

const panelFooter = (): string => `
  <div style="display:flex;margin-top:auto;font-size:21px;color:${LAVENDER_DIM};">psray.net</div>`

const sumTiers = (t: TierCounts): number => t.platinum + t.gold + t.silver + t.bronze

/**
 * Player card: avatar and identity on the light column, lifetime totals on the
 * navy panel, the four tiers on a floating card between them.
 *
 * Everything drawn here is public profile data — callers must refuse private ones.
 */
export function profileCardHtml(card: ProfileCard): string {
  const flag = card.flag
    ? `<img src="${card.flag}" width="34" height="26" style="width:34px;height:26px;border-radius:3px;margin-right:14px;" />`
    : ''

  const left = `
    ${stack(`
    <div style="display:flex;align-items:center;">
      ${artTile(card.avatar, 176, 28)}
      <div style="display:flex;flex-direction:column;margin-left:34px;">
        ${accentBar(64)}
        <div style="display:flex;font-size:56px;font-weight:600;color:${INK};letter-spacing:-1px;margin-top:14px;">${esc(card.psnid)}</div>
        <div style="display:flex;align-items:center;margin-top:12px;">
          ${flag}
          <div style="display:flex;font-size:26px;color:${MUTED};">Level ${num(card.trophyLevel)}</div>
          ${card.rank == null ? '' : `<div style="display:flex;font-size:26px;color:${MUTED};margin-left:22px;">#${num(card.rank)}</div>`}
        </div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;margin-top:40px;">
      ${tierCard(card.trophies)}
    </div>
    `)}

    ${wordmark()}`

  const panel = `
    <div style="display:flex;">${dotGrid(5, 3)}</div>
    <div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;">
      ${panelStat(num(sumTiers(card.trophies)), 'Trophies')}
      <div style="display:flex;flex-direction:column;margin-top:32px;">
        ${panelStat(num(card.playedGames), 'Games', 40)}
      </div>
    </div>
    ${panelFooter()}`

  return shell(left, panel)
}

/**
 * Trophy-set card: cover art and platforms on the light column, how the set plays
 * out across its owners on the navy panel. The set's name is intentionally absent
 * — see the note at the top of this file.
 */
export function trophyCardHtml(card: TrophyCard): string {
  const badges = card.platforms.map((platform) => {
    const label = platformLabel(platform)
    const fill = PLATFORM_COLORS[platform] ?? PLATFORM_FALLBACK
    return `<div style="display:flex;align-items:center;height:42px;padding:0 20px;margin-right:10px;border-radius:21px;background-color:${fill};color:#ffffff;font-size:23px;font-weight:600;">${esc(label)}</div>`
  }).join('')

  const left = `
    ${stack(`
    <div style="display:flex;align-items:center;">
      ${artTile(card.icon, 208, 28)}
      <div style="display:flex;flex-direction:column;margin-left:34px;">
        ${accentBar(64)}
        <div style="display:flex;font-size:52px;font-weight:600;color:${INK};letter-spacing:-1px;margin-top:14px;">${num(sumTiers(card.trophies))}</div>
        <div style="display:flex;font-size:22px;color:${MUTED};margin-top:2px;">Trophies</div>
        <div style="display:flex;margin-top:18px;">${badges}</div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;margin-top:40px;">
      ${tierCard(card.trophies)}
    </div>
    `)}

    ${wordmark()}`

  const panel = `
    <div style="display:flex;">${dotGrid(5, 3)}</div>
    <div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;">
      ${panelStat(`${Math.round(card.averageProgress)}%`, 'Avg progress')}
      <div style="display:flex;flex-direction:column;margin-top:32px;">
        ${panelStat(num(card.owners), 'Owners', 40)}
      </div>
    </div>
    ${panelFooter()}`

  return shell(left, panel)
}
