export const defaultSitemapUrl = 'https://api.psray.net/sitemap.xml'

export function sitemapUrl(value: string): string {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid sitemap URL')
  return url.href
}

export function robotsText(value: string): string {
  return `User-agent: *\nDisallow: /settings\nDisallow: /sync\nDisallow: /auth\nSitemap: ${sitemapUrl(value)}\n`
}
