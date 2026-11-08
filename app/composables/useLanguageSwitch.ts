import { DEFAULT_LOCALE, LANG_COOKIE, type UiLocale } from '#shared/locales'

/**
 * Switching the interface language on the current page — shared by the
 * top-bar menu and the crawlable `<LanguageLinks>`.
 *
 * A target rewrites only `lang`, after every other param, so `psnid` or a
 * login `redirect` survive the switch. `ja`, the default, removes the param —
 * except beside a `?tlang=`, where a trophy-text override needs its interface
 * spelled out (`lang=ja&tlang=…`) to stay distinct from an old link
 * (`docs/seo.md`).
 *
 * The cookie is written on click purely so a later visit to a bare URL comes
 * back in the chosen language; the URL itself remains the source of truth.
 * See `middleware/i18n.global.ts` for how the change is applied.
 */
export function useLanguageSwitch() {
  const route = useRoute()
  const langCookie = useCookie<string | null>(LANG_COOKIE, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  function targetFor(code: UiLocale) {
    const { lang: _lang, tlang, ...rest } = route.query
    const query = tlang !== undefined
      ? { ...rest, lang: code, tlang }
      : code === DEFAULT_LOCALE ? rest : { ...rest, lang: code }
    return { path: route.path, query, hash: route.hash }
  }

  /** Runs before the link navigates, so the middleware sees the new preference. */
  function remember(code: UiLocale) {
    langCookie.value = code
  }

  return { targetFor, remember }
}
