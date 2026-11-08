import { DEFAULT_LOCALE, canonicalContentLang, uiLocaleForPsnLanguage, type UiLocale } from './locales'

/**
 * Old-site URLs that search engines still crawl every day, folded onto today's
 * pages in a single 301 hop.
 *
 * Trophy and trophy-set ids carried over unchanged when the site was rebuilt,
 * so every form maps exactly. Whatever the old URL personalised (`psnid`,
 * paging, the old `?language=`) is dropped: the target is always the public,
 * indexable page, never a `noindex` permutation of it.
 */
export type LegacyRedirect =
  | { kind: 'location', location: string }
  /** `/trophy/:id` forms: the set id has to be looked up, then {@link trophyAnchorUrl}. */
  | { kind: 'trophy', trophyId: number }

/** Cheap pre-check, so ordinary requests skip the parsing below. */
export function isLegacyCandidate(path: string): boolean {
  return path.startsWith('/trophies/') || path.startsWith('/trophy/') || path.startsWith('/laboratory/')
}

export function legacyRedirect(pathname: string, search: string): LegacyRedirect | null {
  const params = new URLSearchParams(search)

  // `/trophies/36026/ja-JP/金色の陽だまりと君の隣-Trophy-Set`: the slug was decoration
  // and the language segment picked the trophy text. Some links had no language
  // segment, only a slug and the old `?language=`.
  const setWithSegment = /^\/trophies\/(\d+)\/([^/]+)(?:\/.*)?$/.exec(pathname)
  if (setWithSegment) {
    const [, id, segment] = setWithSegment
    const locale = legacyLocale(decodeSegment(segment!)) || legacyLocale(params.get('language'))
    return location(trophySetPath(id!, locale))
  }

  // `/trophies/1040?language=fr-FR&psnid=…`
  const set = /^\/trophies\/(\d+)$/.exec(pathname)
  if (set && params.has('language')) return location(trophySetPath(set[1]!, legacyLocale(params.get('language'))))

  // `/trophies/ranking/time-attack?trophies=2522&page=2`: the rankings live on the set page now.
  if (/^\/trophies\/ranking\/(?:time-attack|recent|pioneers)$/.test(pathname)) {
    const id = numericId(params.get('trophies'))
    return id ? location(trophySetPath(id)) : null
  }

  // `/laboratory/contributions/trophies/123`, `…/trophies/region?id=123`
  const laboratory = /^\/laboratory\/contributions\/trophies\/(\d+)(?:\/.*)?$/.exec(pathname)
  if (laboratory) return location(trophySetPath(laboratory[1]!))
  if (/^\/laboratory\/contributions\/trophies\/(?:region|playthroughs|relation)$/.test(pathname)) {
    const id = numericId(params.get('id'))
    return id ? location(trophySetPath(id)) : null
  }

  // `/trophy/636711` and `/trophy/achievers?id=636711`
  const trophy = /^\/trophy\/(\d+)(?:\/.*)?$/.exec(pathname)
  if (trophy) return { kind: 'trophy', trophyId: Number(trophy[1]) }
  if (pathname === '/trophy/achievers') {
    const id = numericId(params.get('id'))
    return id ? { kind: 'trophy', trophyId: Number(id) } : null
  }

  return null
}

/**
 * Where an old single-trophy URL lands: its set page, scrolled to the trophy.
 * The one place to switch once trophies get pages of their own.
 */
export function trophyAnchorUrl(trophySetId: number, trophyId: number): string {
  return `/trophies/${trophySetId}#trophy-${trophyId}`
}

/**
 * `/trophies/1/` → `/trophies/1`, keeping the query: one spelling per page.
 * Nuxt internals (`/_nuxt/…`, `/__nuxt_error`) are left alone.
 */
export function trailingSlashRedirect(pathname: string, search: string): string | null {
  if (pathname === '/' || !pathname.endsWith('/') || pathname.startsWith('/_')) return null
  return `${pathname.replace(/\/+$/, '') || '/'}${search}`
}

function location(target: string): LegacyRedirect {
  return { kind: 'location', location: target }
}

function trophySetPath(id: string, locale: UiLocale | '' = ''): string {
  return locale && locale !== DEFAULT_LOCALE ? `/trophies/${id}?lang=${locale}` : `/trophies/${id}`
}

/**
 * The interface an old language code maps to: its own when the UI is
 * translated into it, English (the `x-default`) for any other PSN language,
 * nothing for a slug or junk.
 */
function legacyLocale(raw: string | null): UiLocale | '' {
  if (!canonicalContentLang(raw)) return ''
  return uiLocaleForPsnLanguage(raw) || 'en'
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  }
  catch {
    // Malformed escapes: treat it as a slug and keep the set itself reachable.
    return ''
  }
}

function numericId(value: string | null): string {
  return value && /^\d+$/.test(value) ? value : ''
}
