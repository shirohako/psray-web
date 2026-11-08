import type { RouteLocationRaw } from 'vue-router'
import type { LinkTarget } from '#shared/langLink'
import { localizeTo } from '~/utils/locale'

/**
 * Internal links that keep the reader's interface language in the URL.
 * `<AppLink>` uses `localize()`; a raw `<a>` with its own click handling takes
 * its `href` from `href()`. Navigations call `localizeTo()` directly.
 *
 * The language is the active one (`?lang=` → cookie → `ja`), not only the
 * URL's: a reader who chose English by cookie still gets `?lang=en` links, so
 * what they copy or share opens in English too.
 */
export function useLangLink() {
  const router = useRouter()
  const href = (to: LinkTarget): string => router.resolve(localizeTo(to) as RouteLocationRaw).href
  return { localize: localizeTo, href }
}
