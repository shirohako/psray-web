/**
 * Query parameters that carry a credential and must never reach analytics.
 * `token` is the signed unsubscribe link from mail footers (`/unsubscribe`):
 * anyone holding it can flip that recipient's mail settings.
 */
const PRIVATE_PARAMS = ['token']

const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i

/**
 * Removes private query parameters from a URL, keeping its shape: an absolute
 * URL stays absolute, and a path (Umami sends same-origin referrers as
 * `/path?query`) stays a path. URLs with nothing to remove come back verbatim.
 */
export function scrubAnalyticsUrl(url: string): string
export function scrubAnalyticsUrl(url: string | undefined): string | undefined
export function scrubAnalyticsUrl(url: string | undefined): string | undefined {
  if (!url) return url

  let parsed: URL
  try {
    parsed = new URL(url, 'https://base.invalid')
  }
  catch {
    return url
  }

  const found = PRIVATE_PARAMS.filter((name) => parsed.searchParams.has(name))
  if (!found.length) return url
  for (const name of found) parsed.searchParams.delete(name)

  return ABSOLUTE_URL.test(url) ? parsed.href : `${parsed.pathname}${parsed.search}${parsed.hash}`
}

/** Whether a URL is the admin console (`/admin`, `/admin/…`), which isn't tracked. */
export function isAdminUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const { pathname } = new URL(url, 'https://base.invalid')
    return pathname === '/admin' || pathname.startsWith('/admin/')
  }
  catch {
    return false
  }
}

export interface UmamiPayload {
  url?: string
  referrer?: string
  [key: string]: unknown
}

/**
 * Umami's `data-before-send` hook: runs on every page view and event before it
 * is sent. Returning `null` cancels the send, which is how admin pages stay out
 * of the stats. Otherwise it scrubs both the page URL and the referrer. The
 * referrer matters too: after `/unsubscribe?token=…`, the next page view names
 * it as referrer.
 */
export function scrubUmamiPayload(_type: string, payload: UmamiPayload): UmamiPayload | null {
  if (isAdminUrl(payload.url)) return null

  return {
    ...payload,
    url: scrubAnalyticsUrl(payload.url),
    referrer: scrubAnalyticsUrl(payload.referrer),
  }
}
