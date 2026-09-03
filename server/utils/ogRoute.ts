import type { H3Event } from 'h3'

/**
 * Shared plumbing for the `/og/*` card routes.
 *
 * Cards are cached as **base64 strings**, not Buffers: Nitro's cache layer
 * serialises what it stores, and a Buffer does not survive that round trip.
 */

/** The static brand card every failure path falls back to. */
export const OG_FALLBACK = '/images/psray-share.jpg'

/** Six hours of freshness, then a week where a stale card may still be served. */
export const OG_CACHE_CONTROL = 'public, max-age=21600, stale-while-revalidate=604800'

/**
 * The route param, minus the `.png` the public URLs carry.
 *
 * radix3 params are whole path segments, so `/og/p/Name.png` arrives as
 * `Name.png` — naming the route file `[psnid].png.ts` would fold the extension
 * into the param *name* instead.
 */
export const ogParam = (raw: string | undefined): string =>
  decodeURIComponent(raw ?? '').replace(/\.png$/i, '')

/** Base URL of the PSRay API, without a trailing slash. */
export const apiBase = (): string =>
  useRuntimeConfig().public.apiBase.replace(/\/+$/, '')

/** Send a rendered card, or bounce to the brand image when we have nothing to draw. */
export function sendCard(event: H3Event, base64: string | null) {
  if (!base64) return sendRedirect(event, OG_FALLBACK, 302)
  setResponseHeaders(event, {
    'content-type': 'image/png',
    'cache-control': OG_CACHE_CONTROL,
  })
  return Buffer.from(base64, 'base64')
}
