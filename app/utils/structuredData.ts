/**
 * schema.org JSON-LD for page heads. Only facts the page shows; nothing that
 * Google could mistake for review or rating markup.
 */

export interface Crumb {
  name: string
  /** Absolute URL. */
  url: string
}

export function breadcrumbJsonLd(crumbs: readonly Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': crumb.url,
    })),
  }
}

export function videoGameJsonLd(game: {
  name: string
  url: string
  image?: string | null
  platforms: readonly string[]
  releaseDate?: string | null
  alternateNames?: readonly string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    'name': game.name,
    'url': game.url,
    ...(game.image ? { image: game.image } : {}),
    ...(game.platforms.length ? { gamePlatform: [...game.platforms] } : {}),
    ...(game.releaseDate ? { datePublished: game.releaseDate } : {}),
    ...(game.alternateNames?.length ? { alternateName: [...game.alternateNames] } : {}),
  }
}

/** A `<script type="application/ld+json">` entry for `useHead`, safe against `</script>` in the data. */
export function jsonLdScript(key: string, data: object) {
  return {
    key,
    type: 'application/ld+json',
    innerHTML: JSON.stringify(data).replace(/</g, '\\u003c'),
  }
}
