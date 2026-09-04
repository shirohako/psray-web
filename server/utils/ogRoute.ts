import type { H3Event } from 'h3'

/**
 * Shared plumbing for the `/card/*` routes.
 *
 * ## The URL shape
 *
 * `/card/<kind>/<id>.png` — one kind of card per directory under `server/routes/card`,
 * spelled out (`profile`, `trophies`) rather than mirroring the page routes' `/p/`.
 *
 * A trailing segment is reserved for alternate treatments of the same subject:
 * `/card/<kind>/<id>/<style>.png`, served by a sibling `[id]/[style].ts`. Nothing
 * uses it yet — it exists so a second style can arrive without moving the URLs
 * link previews have already cached.
 *
 * Cards are cached as **base64 strings**, not Buffers: Nitro's cache layer
 * serialises what it stores, and a Buffer does not survive that round trip.
 */

/** The static brand card every failure path falls back to. */
export const OG_FALLBACK = '/images/psray-share.jpg'

/** Six hours of freshness, then a week where a stale card may still be served. */
export const OG_CACHE_CONTROL = 'public, max-age=21600, stale-while-revalidate=604800'

/**
 * Cache-Control for a card whose render is still running.
 *
 * Short, because the answer is about to change: the render that overran this
 * request keeps going and populates the cache, so a crawler that comes back
 * shortly gets the real card. The long `OG_CACHE_CONTROL` would instead pin a
 * generic brand image in front of that player's page for six hours.
 */
export const OG_PENDING_CACHE_CONTROL = 'public, max-age=60'

/**
 * How long a request will wait on a card that has never been rendered.
 *
 * Every consumer of these URLs is a link-preview crawler on a timeout of a few
 * seconds, and X in particular abandons `summary_large_image` and re-renders
 * the tweet as its small `summary` card when the image does not arrive — the
 * failure this budget exists to prevent. A cold render is a profile API call, a
 * remote avatar, satori, resvg and a PNG encode; usually about a second, but
 * measured as high as thirteen when an upstream is slow.
 *
 * So the wait is capped and a miss answers with the brand card instead. Nothing
 * is thrown away: the render continues, lands in the cache, and every crawl
 * after this one is served from it. With the cache on disk (see
 * `nitro.storage.cache`) a given card can only take this path once.
 *
 * A ceiling on waiting, not a hard deadline. resvg rasterises synchronously, so
 * a budget that expires mid-render cannot preempt it: a trophy card measured
 * 3.9s against this 2.5s, the difference being native work the timer had no
 * thread to fire on. It also means a cold render stalls every other request on
 * the worker for that stretch. Both are why pre-warming matters, and why moving
 * the raster onto a worker thread is the next thing to do here.
 */
const OG_RENDER_BUDGET = 2_500

/** Where a card request ended up, which is also what its `Cache-Control` turns on. */
type CardOutcome =
  /** Rendered, or served from cache. */
  | { state: 'ready'; png: string }
  /** Nothing to draw — an unknown id, or a profile its owner keeps private. */
  | { state: 'empty' }
  /** Still rendering when the budget ran out. */
  | { state: 'pending' }

/**
 * Wait for a card, but not past `OG_RENDER_BUDGET`.
 *
 * The losing promise is deliberately left running rather than aborted, since
 * finishing it is what makes the next request fast. It is detached from this
 * request first: once nothing awaits it, a rejection would otherwise surface as
 * an unhandled rejection, which Node treats as fatal.
 */
async function within(build: Promise<string | null>): Promise<CardOutcome> {
  build.catch(() => {})

  // A sentinel rather than a falsy value: `null` already means "nothing to
  // draw", and the two outcomes cache for very different lengths of time.
  const overran = Symbol('overran')
  let timer: ReturnType<typeof setTimeout> | undefined
  const budget = new Promise<typeof overran>((resolve) => {
    timer = setTimeout(() => resolve(overran), OG_RENDER_BUDGET)
  })

  try {
    const png = await Promise.race([build, budget])
    if (png === overran) return { state: 'pending' }
    return png ? { state: 'ready', png } : { state: 'empty' }
  }
  catch {
    // A render that throws outright is not worth re-entering per crawl.
    return { state: 'empty' }
  }
  finally {
    clearTimeout(timer)
  }
}

/**
 * The route param, minus the `.png` the public URLs carry.
 *
 * radix3 params are whole path segments, so `/card/profile/Name.png` arrives as
 * `Name.png` — naming the route file `[psnid].png.ts` would fold the extension
 * into the param *name* instead.
 */
export const ogParam = (raw: string | undefined): string =>
  decodeURIComponent(raw ?? '').replace(/\.png$/i, '')

/** Base URL of the PSRay API, without a trailing slash. */
export const apiBase = (): string =>
  useRuntimeConfig().public.apiBase.replace(/\/+$/, '')

/**
 * How long the card handlers wait on the API before giving up on a render.
 *
 * `$fetch` has no timeout of its own, so an upstream that accepts a connection
 * and then stalls would hold the render promise — and the cache slot it is
 * pending in — open indefinitely, past every crawler that asked for it.
 */
export const OG_API_TIMEOUT = 3_000

/** Bounce to the brand image, telling caches how long that answer is good for. */
export function sendFallback(event: H3Event, cacheControl = OG_CACHE_CONTROL) {
  setResponseHeader(event, 'cache-control', cacheControl)
  return sendRedirect(event, OG_FALLBACK, 302)
}

/** Send a rendered card, or bounce to the brand image when we have nothing to draw. */
export async function sendCard(event: H3Event, build: Promise<string | null>) {
  const outcome = await within(build)

  if (outcome.state === 'pending') return sendFallback(event, OG_PENDING_CACHE_CONTROL)
  if (outcome.state === 'empty') return sendFallback(event)

  setResponseHeaders(event, {
    'content-type': 'image/png',
    'cache-control': OG_CACHE_CONTROL,
  })
  return Buffer.from(outcome.png, 'base64')
}
