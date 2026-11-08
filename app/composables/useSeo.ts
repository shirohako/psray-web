import { withLang } from '#shared/langLink'
import { DEFAULT_LOCALE, isUiLocale, type UiLocale } from '#shared/locales'
import { resolveSeoImage, type SeoImageType } from '~/utils/seoImage'
import { resolveSeoEditions } from '~/utils/seoLocale'

/**
 * Per-page SEO head: title, description, Open Graph, Twitter card, canonical,
 * `hreflang` alternates and robots — from one call.
 *
 * The i18n module can't supply the alternates itself: under the `no_prefix`
 * strategy its `useLocaleHead()` emits none, and which locales a page is
 * indexed in depends on its content anyway.
 *
 * ## The URL contract (`docs/seo.md`)
 *
 * One language per URL. A page's URL in a locale is its path, then its own
 * list params (`canonicalQuery`: already normalized, in a fixed order), then
 * `?lang=` — with `ja`, the default, spelled as no param at all.
 *
 * A page is indexed in its **editions**: the UI locales its content exists in
 * (`contentEditions()` / `profileEditions()`; all five by default).
 *
 * - Rendered in one of its editions, a page is indexable: its canonical is
 *   itself, and it lists every edition as an `hreflang` alternate, plus
 *   `x-default` → English.
 * - Otherwise — `noindex`, or a locale outside its editions — it says
 *   `noindex, follow` and nothing more: no canonical, no alternates.
 *
 * Any other param (`psnid`, `tlang`, filters, …) never reaches a canonical;
 * pages that render them make themselves `noindex` instead.
 */

/** A value, or a getter for one — so callers can hang SEO off pending async data. */
type Source<T> = T | (() => T)

const read = <T>(source: Source<T> | undefined): T | undefined =>
  typeof source === 'function' ? (source as () => T)() : source

function withSiteTitle(title: string, siteNameFirst = false): string {
  const pageTitle = title.replace(/\s*[|｜]\s*PSRay\s*$/i, '').trim()
  if (pageTitle === 'PSRay') return pageTitle
  return siteNameFirst ? `PSRay | ${pageTitle}` : `${pageTitle} | PSRay`
}

export interface SeoInput {
  title: Source<string>
  /** Places the site name before the page title. Reserved for the homepage. */
  siteNameFirst?: boolean
  /** Canonical pathname. Defaults to the current route path. */
  canonicalPath?: Source<string>
  /**
   * The page's own params that make it a distinct, indexable list — a library
   * category, a page number — already normalized and in URL order. `lang`
   * comes after them. Anything not listed here never reaches the canonical.
   */
  canonicalQuery?: Source<Record<string, string> | undefined>
  description?: Source<string>
  /**
   * Absolute image URL for `og:image` / `twitter:image`. Omit it — or let it
   * resolve to nothing while data loads — and the brand card stands in.
   */
  image?: Source<string | undefined>
  /** Accessible description for the social preview image. */
  imageAlt?: Source<string | undefined>
  /** Intrinsic social preview dimensions, when known. */
  imageWidth?: Source<number | undefined>
  imageHeight?: Source<number | undefined>
  /** MIME type for the social preview image, such as `image/png`. */
  imageType?: Source<SeoImageType | undefined>
  /** UI locales this page is indexed in. Defaults to all five. */
  editions?: Source<readonly UiLocale[] | undefined>
  noindex?: Source<boolean>
  /**
   * Marks a page as having one fixed UI-language edition. Its canonical URL
   * never carries `?lang=`, no translated hreflang alternates are emitted,
   * and Open Graph uses this locale regardless of the surrounding UI chrome.
   */
  staticLocale?: UiLocale
}

export function useSeo(input: SeoInput) {
  const route = useRoute()
  const { t, locale } = useI18n()
  const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/+$/, '')

  /**
   * Absolute URL of this page in `lang`. Params are appended in a fixed order
   * so the same state always spells the same URL.
   */
  const urlFor = (lang: UiLocale) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(read(input.canonicalQuery) ?? {})) {
      if (value) params.set(key, value)
    }
    if (!input.staticLocale && lang !== DEFAULT_LOCALE) params.set('lang', lang)
    const search = params.toString()
    const path = read(input.canonicalPath) || route.path
    return `${siteUrl}${path}${search ? `?${search}` : ''}`
  }

  const activeLocale = computed<UiLocale>(() =>
    isUiLocale(locale.value) ? locale.value : DEFAULT_LOCALE)

  const policy = computed(() => resolveSeoEditions({
    staticLocale: input.staticLocale,
    active: activeLocale.value,
    editions: read(input.editions),
    noindex: Boolean(read(input.noindex)),
  }))

  const title = computed(() => withSiteTitle(read(input.title)!, input.siteNameFirst))

  // `seo.home.title` is the site's own one-line pitch, which is exactly what
  // the brand card depicts — no separate catalog key to keep translated.
  const image = computed(() => resolveSeoImage(siteUrl, {
    url: read(input.image),
    alt: read(input.imageAlt),
    width: read(input.imageWidth),
    height: read(input.imageHeight),
    type: read(input.imageType),
  }, `PSRay — ${t('seo.home.title')}`))

  const canonical = computed(() =>
    policy.value.indexable ? urlFor(policy.value.canonicalLocale) : null)

  const alternates = computed(() => policy.value.alternates.length
    ? [
        { rel: 'alternate' as const, hreflang: 'x-default', href: urlFor(policy.value.xDefault) },
        ...policy.value.alternates.map(code => ({
          rel: 'alternate' as const,
          hreflang: code,
          href: urlFor(code),
        })),
      ]
    : [])

  useSeoMeta({
    title: () => title.value,
    description: () => read(input.description),
    ogType: 'website',
    ogSiteName: 'PSRay',
    ogTitle: () => title.value,
    ogDescription: () => read(input.description),
    ogImage: () => image.value.url,
    ogImageAlt: () => image.value.alt,
    ogImageWidth: () => image.value.width,
    ogImageHeight: () => image.value.height,
    ogImageType: () => image.value.type,
    // A personal view still shares as its public page.
    ogUrl: () => canonical.value ?? urlFor(policy.value.canonicalLocale),
    ogLocale: () => policy.value.ogLocale,
    ogLocaleAlternate: () => (policy.value.ogAlternates.length ? policy.value.ogAlternates : undefined),
    twitterCard: 'summary_large_image',
    twitterSite: '@shionari_',
    twitterCreator: '@shionari_',
    twitterTitle: () => title.value,
    twitterDescription: () => read(input.description),
    twitterImage: () => image.value.url,
    twitterImageAlt: () => image.value.alt,
    twitterImageWidth: () => image.value.width,
    twitterImageHeight: () => image.value.height,
    // `follow` even when noindex: these pages still link on to indexable ones.
    robots: () => (policy.value.indexable ? undefined : 'noindex, follow'),
  })

  useHead(() => ({
    link: [...(canonical.value ? [{ rel: 'canonical', href: canonical.value }] : []), ...alternates.value],
  }))

  return {
    canonical,
    urlFor,
    /**
     * Absolute URL of another page (`/games/1`) in this response's language,
     * for structured data. Safe inside head getters, which unhead evaluates
     * outside any component: the `localizeTo()` helpers are not.
     */
    absoluteUrl: (path: string) => `${siteUrl}${withLang(path, activeLocale.value)}`,
    indexable: computed(() => policy.value.indexable),
  }
}
