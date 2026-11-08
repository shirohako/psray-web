import {
  DEFAULT_LOCALE,
  OG_LOCALE,
  UI_LOCALES,
  type UiLocale,
} from '#shared/locales'

export interface SeoEditionsInput {
  /** Single-language page: its body is in this locale whatever the interface. */
  staticLocale?: UiLocale
  /** The interface locale this response renders in. */
  active: UiLocale
  /** UI locales the page is indexed in; all five when omitted. */
  editions?: readonly UiLocale[]
  noindex: boolean
}

export interface SeoEditions {
  indexable: boolean
  /** Locale of the canonical URL: the active one, or the static locale. */
  canonicalLocale: UiLocale
  /** `hreflang` alternates in UI order; empty when not indexable or single-language. */
  alternates: UiLocale[]
  /** Where `x-default` points: English, the fallback for every language we lack. */
  xDefault: UiLocale
  ogLocale: string
  ogAlternates: string[]
}

/**
 * Pure editions policy shared by `useSeo()` and its unit tests: whether this
 * response is an indexable edition of its page, and which editions it lists.
 * A response in a locale outside the page's editions — a Korean interface
 * around English trophy text — is a personal view: `noindex`, no alternates.
 */
export function resolveSeoEditions({ staticLocale, active, editions, noindex }: SeoEditionsInput): SeoEditions {
  if (staticLocale) {
    return {
      indexable: !noindex,
      canonicalLocale: staticLocale,
      alternates: [],
      xDefault: staticLocale,
      ogLocale: OG_LOCALE[staticLocale],
      ogAlternates: [],
    }
  }

  const list = UI_LOCALES.filter(code => (editions ?? UI_LOCALES).includes(code))
  const indexable = !noindex && list.includes(active)
  return {
    indexable,
    canonicalLocale: active,
    alternates: indexable ? list : [],
    xDefault: list.includes('en') ? 'en' : list[0] ?? DEFAULT_LOCALE,
    ogLocale: OG_LOCALE[active],
    ogAlternates: list.filter(code => code !== active).map(code => OG_LOCALE[code]),
  }
}
