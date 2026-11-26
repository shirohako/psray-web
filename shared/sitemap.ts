export function sitemapUrl(value: string): string {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid sitemap URL')
  return url.href
}

/** Account, tooling and auth areas: kept out of crawlers and the Markdown view. */
export const PRIVATE_PATHS = ['/admin', '/settings', '/me', '/sync', '/auth'] as const

/**
 * Whether a pathname lies in one of the private areas, matched by whole path
 * segment (`/me/tips` is private, `/meta` is not). robots.txt's own prefix
 * rules are broader, which errs the safe way.
 */
export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

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
