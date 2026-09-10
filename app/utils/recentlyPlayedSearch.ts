export const RECENTLY_PLAYED_SEARCH_MAX_LENGTH = 100
export const RECENTLY_PLAYED_SEARCH_MIN_KEYWORD_LENGTH = 2
export const RECENTLY_PLAYED_SEARCH_MAX_KEYWORDS = 3

export type RecentlyPlayedSearchError = 'tooLong' | 'noValidKeywords' | 'tooManyKeywords'

export interface RecentlyPlayedSearchResult {
  query: string
  error: RecentlyPlayedSearchError | null
}

/**
 * Apply the same keyword bounds as `GET /profile/{psnid}/recently-played`.
 * Length is counted by Unicode code point so CJK input is treated as users
 * expect, rather than by UTF-16 code unit.
 */
export function validateRecentlyPlayedSearch(input: string): RecentlyPlayedSearchResult {
  const query = input.trim()
  if (!query) return { query: '', error: null }

  if (Array.from(query).length > RECENTLY_PLAYED_SEARCH_MAX_LENGTH) {
    return { query, error: 'tooLong' }
  }

  const effectiveKeywords = query
    .split(/\s+/u)
    .filter(keyword => Array.from(keyword).length >= RECENTLY_PLAYED_SEARCH_MIN_KEYWORD_LENGTH)

  if (!effectiveKeywords.length) return { query, error: 'noValidKeywords' }
  if (effectiveKeywords.length > RECENTLY_PLAYED_SEARCH_MAX_KEYWORDS) {
    return { query, error: 'tooManyKeywords' }
  }

  return { query, error: null }
}

export function recentlyPlayedPath(psnid: string, page: number, query = ''): string {
  const params = new URLSearchParams({ page: String(page) })
  if (query) params.set('q', query)
  return `/profile/${encodeURIComponent(psnid)}/recently-played?${params.toString()}`
}
