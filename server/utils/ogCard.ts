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

const INK = '#0f172a'
const MUTED = '#64748b'
const HAIRLINE = '#e2e8f0'

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

/** The page ground: the same near-white slate the site itself sits on. */
const shell = (body: string): string => `
  <div style="display:flex;flex-direction:column;width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;padding:56px 64px;background-color:#f8fafc;font-family:Inter;">
    ${body}
  </div>`

/** The card body, vertically centred in whatever space the footer leaves. */
const main = (body: string): string => `
  <div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;">
    ${body}
  </div>`

/** Wordmark left, domain right, sitting on a hairline above the card's bottom edge. */
const footer = (): string => `
  <div style="display:flex;align-items:center;justify-content:space-between;padding-top:28px;border-top:1px solid ${HAIRLINE};">
    <div style="display:flex;font-size:30px;font-weight:600;color:${INK};letter-spacing:-0.5px;">PSRay</div>
    <div style="display:flex;font-size:24px;color:${MUTED};">psray.net</div>
  </div>`

/** One tier: a colour dot beside its count, with the tier name underneath. */
const tierBlock = (tier: TierKey, count: number): string => `
  <div style="display:flex;flex-direction:column;">
    <div style="display:flex;align-items:center;">
      <div style="display:flex;width:18px;height:18px;border-radius:9px;background-color:${TIER_COLORS[tier]};margin-right:12px;"></div>
      <div style="display:flex;font-size:40px;font-weight:600;color:${INK};">${num(count)}</div>
    </div>
    <div style="display:flex;font-size:20px;color:${MUTED};margin-top:4px;text-transform:capitalize;">${tier}</div>
  </div>`

/** All four tiers, spread edge to edge so the card has no dead column. */
const tierRow = (t: TierCounts): string => `
  <div style="display:flex;justify-content:space-between;">
    ${TIERS.map(tier => tierBlock(tier, t[tier])).join('')}
  </div>`

/** A rounded art tile, or a neutral placeholder of the same size when the fetch failed. */
const artTile = (src: string | null, size: number, radius: number): string =>
  (src
    ? `<img src="${src}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:${radius}px;" />`
    : `<div style="display:flex;width:${size}px;height:${size}px;border-radius:${radius}px;background-color:#e2e8f0;"></div>`)

const statBlock = (value: string, label: string): string => `
  <div style="display:flex;flex-direction:column;">
    <div style="display:flex;font-size:44px;font-weight:600;color:${INK};">${value}</div>
    <div style="display:flex;font-size:20px;color:${MUTED};margin-top:4px;">${label}</div>
  </div>`

const sumTiers = (t: TierCounts): number => t.platinum + t.gold + t.silver + t.bronze

/**
 * Player card: avatar and identity on the left of the header, headline totals on
 * the right, the four tiers spread across the foot.
 *
 * Everything drawn here is public profile data — callers must refuse private ones.
 */
export function profileCardHtml(card: ProfileCard): string {
  const flag = card.flag
    ? `<img src="${card.flag}" width="36" height="27" style="width:36px;height:27px;border-radius:3px;margin-right:16px;" />`
    : ''

  return shell(`
    ${main(`
      <div style="display:flex;align-items:center;">
        ${artTile(card.avatar, 240, 36)}
        <div style="display:flex;flex-direction:column;margin-left:44px;">
          <div style="display:flex;font-size:64px;font-weight:600;color:${INK};letter-spacing:-1px;">${esc(card.psnid)}</div>
          <div style="display:flex;align-items:center;margin-top:16px;">
            ${flag}
            <div style="display:flex;font-size:28px;color:${MUTED};">Level ${num(card.trophyLevel)}</div>
            ${card.rank == null ? '' : `<div style="display:flex;font-size:28px;color:${MUTED};margin-left:24px;">#${num(card.rank)}</div>`}
          </div>
        </div>
        <div style="display:flex;margin-left:auto;">
          <div style="display:flex;margin-right:56px;">${statBlock(num(sumTiers(card.trophies)), 'Trophies')}</div>
          ${statBlock(num(card.playedGames), 'Games')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;margin-top:56px;">
        ${tierRow(card.trophies)}
      </div>
    `)}

    ${footer()}
  `)
}

/**
 * Trophy-set card: cover art on the left, platforms, headline stats and the tier
 * breakdown filling the right. The set's name is intentionally absent — see the
 * note at the top of this file.
 */
export function trophyCardHtml(card: TrophyCard): string {
  const badges = card.platforms.map((platform) => {
    const label = platformLabel(platform)
    const fill = PLATFORM_COLORS[platform] ?? PLATFORM_FALLBACK
    return `<div style="display:flex;align-items:center;height:44px;padding:0 20px;margin-right:12px;border-radius:22px;background-color:${fill};color:#ffffff;font-size:24px;font-weight:600;">${esc(label)}</div>`
  }).join('')

  return shell(`
    ${main(`
      <div style="display:flex;align-items:center;">
        ${artTile(card.icon, 320, 32)}
        <div style="display:flex;flex-direction:column;flex-grow:1;margin-left:48px;">
          <div style="display:flex;">${badges}</div>
          <div style="display:flex;justify-content:space-between;margin-top:36px;">
            ${statBlock(num(sumTiers(card.trophies)), 'Trophies')}
            ${statBlock(num(card.owners), 'Owners')}
            ${statBlock(`${Math.round(card.averageProgress)}%`, 'Avg progress')}
          </div>
          <div style="display:flex;flex-direction:column;margin-top:36px;">
            ${tierRow(card.trophies)}
          </div>
        </div>
      </div>
    `)}

    ${footer()}
  `)
}
