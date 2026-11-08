import { DEFAULT_LOCALE, PSN_LANG, canonicalContentLang, uiLocaleFor, uiLocaleForPsnLanguage, type UiLocale } from './locales'

/**
 * The trophy text language rules of the `?lang=` URL contract (`docs/seo.md`).
 *
 * A trophy page's text follows its interface language. `?tlang=` is a reader's
 * override on top of that: the page renders, but as a personal view it is
 * `noindex` — unless it changes nothing, in which case it 301s away.
 */

export type RouteQuery = Record<string, unknown>

/**
 * The language a trophy set is shown in, for an ordered preference list: for
 * each preference the exact code, then any variant of the same language; then
 * the set's default language; then whatever it has.
 *
 * A line-for-line mirror of the API's `TranslationResolver::pick`, which
 * decides what the page actually shows — keep the two identical (the tests
 * share their vectors).
 */
export function pickTrophyLanguage(
  available: readonly string[],
  preferred: readonly string[],
  defaultLanguage?: string | null,
): string {
  for (const code of preferred) {
    if (!code) continue
    if (available.includes(code)) return code
    const iso = code.split('-')[0]
    const variant = available.find(candidate => candidate.split('-')[0] === iso)
    if (variant) return variant
  }
  if (defaultLanguage && (!available.length || available.includes(defaultLanguage))) return defaultLanguage
  return available[0] ?? defaultLanguage ?? ''
}

/**
 * `query` for showing the trophy text in `tlang`, or with `null` in whatever
 * the interface implies, keeping every other param.
 *
 * With a `tlang`, `lang` is always spelled out — `lang=ja` included, the only
 * place it ever is — so a `tlang` without a `lang` can only be an old link.
 */
export function withTrophyLanguage(query: RouteQuery, locale: UiLocale, tlang: string | null): RouteQuery {
  const { lang: _lang, tlang: _tlang, ...rest } = query
  if (tlang) return { ...rest, lang: locale, tlang }
  return locale === DEFAULT_LOCALE ? rest : { ...rest, lang: locale }
}

export interface TrophyLanguageState {
  /** Every language the set ships in (`available_languages`). */
  available: readonly string[]
  defaultLanguage?: string | null
  /** The language the API actually served for this request. */
  served: string
  /** Whether the reader has a trophy-language preference switched on. */
  preferenceEnabled: boolean
}

/**
 * Where a `?tlang=` URL should 301 to, or `null` to render it as it is.
 *
 * - A malformed `tlang` is dropped.
 * - A `tlang` that changes nothing — the page without it shows the same text —
 *   is dropped, so the reader lands on the indexable page.
 * - An old link (`tlang`, no `lang`: the previous URL scheme) also moves its
 *   interface to that language when there is one, `?tlang=en-US` → `?lang=en`.
 * - Never for a reader with a trophy-language preference: for them the page
 *   without `tlang` shows the preferred language, so the param does matter.
 */
export function tlangRedirect(query: RouteQuery, state: TrophyLanguageState): RouteQuery | null {
  if (!('tlang' in query)) return null
  const { tlang: raw, ...rest } = query
  const tlang = canonicalContentLang(raw as string)
  if (!tlang) return withTrophyLanguage(rest, uiLocaleFor(rest.lang as string) || DEFAULT_LOCALE, null)
  if (state.preferenceEnabled) return null

  const locale = uiLocaleFor(query.lang as string)
    || uiLocaleForPsnLanguage(tlang)
    || uiLocaleForPsnLanguage(state.served)
  if (!locale) return null
  if (pickTrophyLanguage(state.available, [PSN_LANG[locale]], state.defaultLanguage) !== state.served) return null
  return withTrophyLanguage(rest, locale, null)
}
