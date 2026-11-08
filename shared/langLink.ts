import { DEFAULT_LOCALE, type UiLocale } from './locales'

/** A route target as `<NuxtLink :to>` / `navigateTo()` take it, structurally. */
export type LinkTarget = string | { query?: Record<string, unknown>, [key: string]: unknown }

const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i

/**
 * `to`, carrying the interface language `locale` as `?lang=`.
 *
 * Every internal link goes through this (via `<AppLink>` / `useLangLink()`):
 * a crawler has no language cookie, so the `href` alone decides which edition
 * it lands on, and an English page must lead on to English pages.
 *
 * - `ja`, the default, is the bare URL: nothing is added.
 * - `lang` goes after the target's own params, the order canonical URLs use.
 * - External URLs, other relative forms and targets that already say which
 *   `lang` they want are returned unchanged — `query: { lang: undefined }` is
 *   the explicit "bare URL" (the language switcher's Japanese entry).
 */
export function withLang<T extends LinkTarget>(to: T, locale: UiLocale): T {
  if (locale === DEFAULT_LOCALE || to == null) return to

  if (typeof to === 'string') {
    if (!to.startsWith('/') || EXTERNAL.test(to)) return to
    const hashAt = to.indexOf('#')
    const hash = hashAt === -1 ? '' : to.slice(hashAt)
    const beforeHash = hashAt === -1 ? to : to.slice(0, hashAt)
    const queryAt = beforeHash.indexOf('?')
    const path = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt)
    const params = new URLSearchParams(queryAt === -1 ? '' : beforeHash.slice(queryAt + 1))
    if (params.has('lang')) return to
    params.append('lang', locale)
    return `${path}?${params}${hash}` as T
  }

  if (to.query && 'lang' in to.query) return to
  return { ...to, query: { ...to.query, lang: locale } }
}
