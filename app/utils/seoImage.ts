export type SeoImageType = 'image/jpeg' | 'image/gif' | 'image/png' | 'image/webp' | 'image/avif'

export interface SeoImage {
  url: string
  alt?: string
  width?: number
  height?: number
  type?: SeoImageType
}

/**
 * The brand social card, served from `public/`. Every page that has no image of
 * its own falls back to this, so a shared link is never a bare text card.
 */
export const SHARE_IMAGE = {
  path: '/images/psray-share.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
} as const satisfies Omit<SeoImage, 'url' | 'alt'> & { path: string }

/**
 * Pure social-image policy shared by the Nuxt head composable and unit tests.
 *
 * A caller's own image is passed through untouched: a profile's PSN avatar and
 * a trophy set's icon are arbitrary square art off Sony's CDN, so we have no
 * dimensions to advertise for them and must not invent any. Only the fallback,
 * whose geometry we control, carries `width`/`height`/`type`.
 */
export function resolveSeoImage(
  siteUrl: string,
  provided: Partial<SeoImage>,
  fallbackAlt: string,
): SeoImage {
  if (provided.url) {
    return {
      url: provided.url,
      alt: provided.alt,
      width: provided.width,
      height: provided.height,
      type: provided.type,
    }
  }

  return {
    url: `${siteUrl.replace(/\/+$/, '')}${SHARE_IMAGE.path}`,
    alt: provided.alt || fallbackAlt,
    width: SHARE_IMAGE.width,
    height: SHARE_IMAGE.height,
    type: SHARE_IMAGE.type,
  }
}
