export function sitemapUrl(value: string): string {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid sitemap URL')
  return url.href
}

const PRIVATE_PATHS = ['/admin', '/settings', '/me', '/sync', '/auth']

/**
 * SEO-tool crawlers: tens of thousands of SSR renders a day between them and
 * no visitors in return. They honour robots.txt, so one group shuts them out.
 */
const BLOCKED_CRAWLERS = ['AhrefsBot', 'DotBot', 'MJ12bot', 'SemrushBot']

export function robotsText(value: string): string {
  return [
    'User-agent: *',
    ...PRIVATE_PATHS.map(path => `Disallow: ${path}`),
    '',
    ...BLOCKED_CRAWLERS.map(agent => `User-agent: ${agent}`),
    'Disallow: /',
    '',
    `Sitemap: ${sitemapUrl(value)}`,
    '',
  ].join('\n')
}
