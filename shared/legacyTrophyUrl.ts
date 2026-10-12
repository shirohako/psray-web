import { canonicalContentLang } from './locales'

/**
 * The old site addressed a trophy set as `/trophies/:id/:lang/:slug`, e.g.
 * `/trophies/36026/ja-JP/金色の陽だまりと君の隣-Trophy-Set`. The slug was only
 * decoration and the language segment is today's `?tlang=`, so the path folds
 * onto `/trophies/:id`. Returns `null` for anything that isn't such a path.
 */
export function legacyTrophyRedirect(pathname: string, search: string): string | null {
  const match = /^\/trophies\/(\d+)\/([^/]+)(?:\/.*)?$/.exec(pathname)
  if (!match) return null
  const [, id, segment] = match

  const params = new URLSearchParams(search)
  let lang = ''
  try {
    lang = canonicalContentLang(decodeURIComponent(segment!))
  }
  catch {
    // Malformed escapes: drop the segment and keep the set itself reachable.
  }
  if (lang && !params.has('tlang')) params.set('tlang', lang)

  const query = params.toString()
  return `/trophies/${id}${query ? `?${query}` : ''}`
}
