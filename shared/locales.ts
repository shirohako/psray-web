/**
 * The single source of truth for languages across the app.
 *
 * **One language per URL.** `?lang=` picks one of the five UI locales, and with
 * it the language of the page's content: a trophy set's text follows the
 * interface ({@link PSN_LANG}). The default (`ja`) is the bare URL with no param
 * at all. Only these URLs are indexed — see `docs/seo.md` for the contract.
 *
 * `?tlang=` remains as a reader's override of the trophy text (French trophy
 * names in a Chinese interface, say). Such a page renders normally but is
 * `noindex`: it's a personal view, not an edition.
 *
 * Which UI locales a page is worth indexing in — its **editions** — depends on
 * whether its content exists in that language: {@link contentEditions},
 * {@link profileEditions}. The backend sitemap applies the same rules
 * (`psray-api/app/Services/SitemapLanguages.php`).
 *
 * Everything is visible to the server, so a rendered page stays a pure function
 * of (URL, cookie) — which is all indexing needs.
 *
 * Importable from `app/` and from Nitro alike via the `#shared` alias.
 */

export const UI_LOCALES = ['ja', 'zh-Hans', 'zh-Hant', 'en', 'ko'] as const

export type UiLocale = typeof UI_LOCALES[number]

/** Renders on the bare URL; `?lang=ja` is never written, only stripped. */
export const DEFAULT_LOCALE: UiLocale = 'ja'

/** Cookie remembering a manual switch. Read during SSR, so it can't desync hydration. */
export const LANG_COOKIE = 'psray_lang'

/** BCP-47 tag for `<html lang>` and `hreflang`. */
export const HTML_LANG: Record<UiLocale, string> = {
  'ja': 'ja-JP',
  'zh-Hans': 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  'en': 'en-US',
  'ko': 'ko-KR',
}

/** `og:locale` wants `language_TERRITORY`, not a BCP-47 tag. */
export const OG_LOCALE: Record<UiLocale, string> = {
  'ja': 'ja_JP',
  'zh-Hans': 'zh_CN',
  'zh-Hant': 'zh_TW',
  'en': 'en_US',
  'ko': 'ko_KR',
}

/** UI locale → the PSN language code we ask the trophy API for by default. */
export const PSN_LANG: Record<UiLocale, string> = {
  'ja': 'ja-JP',
  'zh-Hans': 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  'en': 'en-US',
  'ko': 'ko-KR',
}

/**
 * Incoming spellings that mean one of our UI locales. Keyed lowercase.
 * Collapsing these is what stops `/trophies/1?lang=ja-JP` and `/trophies/1`
 * being indexed as two copies of the same page.
 */
const ALIASES: Record<string, UiLocale> = {
  'ja': 'ja',
  'ja-jp': 'ja',
  'zh-hans': 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh-sg': 'zh-Hans',
  'zh-hant': 'zh-Hant',
  'zh-tw': 'zh-Hant',
  'zh-hk': 'zh-Hant',
  'en': 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'ko': 'ko',
  'ko-kr': 'ko',
}

/** A `?lang=` value can arrive as `string | string[] | undefined` from `route.query`. */
export type LangParam = string | (string | null)[] | null | undefined

const first = (raw: LangParam): string => {
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value : ''
}

/**
 * Fold any `?lang=` value onto its canonical URL spelling.
 *
 * - Aliases of a UI locale collapse onto it (`ja-JP` → `ja`, `zh-CN` → `zh-Hans`).
 * - Any other well-formed language tag passes through as-is, preserving case —
 *   these are the ~20 PSN-only codes (`fr-FR`, `pt-BR`, `es-419`, …).
 * - Anything malformed returns `''`.
 */
export function canonicalLang(raw: LangParam): string {
  const value = first(raw)
  if (!value) return ''
  const alias = ALIASES[value.toLowerCase()]
  if (alias) return alias
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,4})?$/i.test(value) ? value : ''
}

/**
 * Validate a trophy-content language without folding it onto a UI locale.
 * API language codes are URL request values, so `en-US` must stay `en-US`
 * even though it corresponds to the English UI locale.
 */
export function canonicalContentLang(raw: LangParam): string {
  const value = first(raw)
  if (!value) return ''
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,4})?$/i.test(value) ? value : ''
}

/**
 * Which of the five UI locales should render the chrome for this `?lang=` value,
 * or `''` when it names a language we have no interface for (callers then fall
 * back to the cookie, then {@link DEFAULT_LOCALE}).
 */
export function uiLocaleFor(raw: LangParam): UiLocale | '' {
  const code = canonicalLang(raw)
  return (UI_LOCALES as readonly string[]).includes(code) ? code as UiLocale : ''
}

/**
 * The UI locale whose readers a PSN language tag belongs to — a trophy set's
 * translation, a profile's PSN language, an old-site URL segment — or `''`
 * when the interface isn't translated into it. Case-insensitive, and regional
 * spellings fold onto their script (`zh-TW` → `zh-Hant`, `en-GB` → `en`).
 */
export function uiLocaleForPsnLanguage(raw: LangParam): UiLocale | '' {
  const [language, subtag = ''] = canonicalContentLang(raw).toLowerCase().split('-')
  if (language === 'ja' || language === 'en' || language === 'ko') return language
  if (language !== 'zh') return ''
  if (['hant', 'tw', 'hk', 'mo'].includes(subtag)) return 'zh-Hant'
  if (['hans', 'cn', 'sg', 'my'].includes(subtag)) return 'zh-Hans'
  return ''
}

/** Narrowing guard for values read back out of cookies, payloads, or the API. */
export function isUiLocale(value: unknown): value is UiLocale {
  return typeof value === 'string' && (UI_LOCALES as readonly string[]).includes(value)
}

/**
 * Resolve the UI locale from a request, in the project's fixed precedence:
 * `?lang=` → cookie → `ja`. Browser `Accept-Language` is deliberately *not*
 * consulted: a bare URL must render identically for every visitor and crawler.
 */
export function resolveUiLocale(langParam: LangParam, cookieValue: LangParam): UiLocale {
  return uiLocaleFor(langParam) || uiLocaleFor(cookieValue) || DEFAULT_LOCALE
}

/** Keeps the UI order, whatever order `locales` came in. */
const inUiOrder = (locales: Iterable<UiLocale>): UiLocale[] => {
  const wanted = new Set(locales)
  return UI_LOCALES.filter(code => wanted.has(code))
}

/**
 * The UI locales a trophy set or game is worth indexing in: Japanese (the bare
 * URL) and English (the `x-default`) always, plus Chinese and Korean only when
 * the content itself exists in them. A Korean interface around English trophy
 * text translates the boilerplate, not the page — Google treats such pages as
 * duplicates, so they stay `noindex`.
 *
 * `codes` are the content's languages (a set's official translations, a game's
 * translated titles); an empty list falls back to `defaultLanguage`.
 */
export function contentEditions(codes: readonly string[], defaultLanguage?: string | null): UiLocale[] {
  const languages = codes.length ? codes : defaultLanguage ? [defaultLanguage] : []
  const editions = new Set<UiLocale>(['ja', 'en'])
  for (const code of languages) {
    const locale = uiLocaleForPsnLanguage(code)
    if (locale) editions.add(locale)
  }
  return inUiOrder(editions)
}

/**
 * The UI locales a profile is worth indexing in: Japanese and English, plus the
 * interfaces of the player's own PSN languages (`user.language`, e.g.
 * `["zh-CN","zh-TW","en"]`) — the readers likely to search for that PSN ID.
 */
export function profileEditions(languages: unknown): UiLocale[] {
  const editions = new Set<UiLocale>(['ja', 'en'])
  for (const code of Array.isArray(languages) ? languages : []) {
    const locale = typeof code === 'string' ? uiLocaleForPsnLanguage(code) : ''
    if (locale) editions.add(locale)
  }
  return inUiOrder(editions)
}
