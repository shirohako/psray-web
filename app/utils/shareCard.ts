/** Card route under `/card/`. */
export type ShareCardKind = 'profile' | 'trophies'

/**
 * Cache-busting version per card kind, for URLs that carry no version of their
 * own (`og:image`, the header's preview button). Bump a kind when its design
 * changes, so platforms that cache by URL fetch the new image.
 */
export const SHARE_CARD_VERSION = { profile: 4, trophies: 3 } as const satisfies Record<ShareCardKind, number>

/**
 * Public URL of a backend-rendered share card, without a cache-busting query:
 * this is the address people copy and share.
 *
 * @param base The card host (`runtimeConfig.public.cardBase`).
 * @param slug A lowercased PSN ID, or a trophy set id.
 */
export function shareCardUrl(base: string, kind: ShareCardKind, slug: string | number): string {
  return `${base.replace(/\/+$/, '')}/card/${kind}/${encodeURIComponent(String(slug))}.png`
}
