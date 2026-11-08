import { isLegacyCandidate, legacyRedirect, trailingSlashRedirect, trophyAnchorUrl } from '../../shared/legacyUrls'

/**
 * Set id of an old-site trophy id, or `null` when there's no such trophy.
 * Ids never move, so a week of caching is safe; `null` is cached too, errors
 * are not (they propagate and the request answers 503).
 */
const trophySetIdOf = defineCachedFunction(async (trophyId: number): Promise<number | null> => {
  try {
    const response = await $fetch<{ data: { trophy_set_id: number } }>(`/trophies/trophy/${trophyId}`, {
      baseURL: useRuntimeConfig().public.apiBase,
      timeout: 3000,
      retry: 1,
    })
    return response.data.trophy_set_id
  }
  catch (error) {
    // Only the API's own verdict counts as "no such trophy". Any other 404 (say,
    // an API without this route yet) must not be cached as a miss for a week.
    const body = (error as { data?: { error?: { code?: string } } }).data
    if (body?.error?.code === 'TROPHY_NOT_FOUND') return null
    throw error
  }
}, {
  name: 'legacy-trophy-set',
  maxAge: 60 * 60 * 24 * 7,
  getKey: (trophyId: number) => String(trophyId),
})

/** 301s old-site URLs (and trailing-slash spellings) onto today's pages; see `shared/legacyUrls.ts`. */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  const unslashed = trailingSlashRedirect(url.pathname, url.search)
  if (unslashed) return sendRedirect(event, unslashed, 301)

  if (!isLegacyCandidate(url.pathname)) return
  const redirect = legacyRedirect(url.pathname, url.search)
  if (!redirect) return
  if (redirect.kind === 'location') return sendRedirect(event, redirect.location, 301)

  let trophySetId: number | null
  try {
    trophySetId = await trophySetIdOf(redirect.trophyId)
  }
  catch {
    // Say "come back later", not 404: a crawler would drop the URL for good.
    setResponseStatus(event, 503)
    setResponseHeader(event, 'Retry-After', '300')
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'Service Unavailable'
  }
  // Unknown trophy: fall through to the app's own 404 page.
  if (trophySetId === null) return
  return sendRedirect(event, trophyAnchorUrl(trophySetId, redirect.trophyId), 301)
})
