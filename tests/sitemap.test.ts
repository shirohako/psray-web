import { describe, expect, it } from 'vitest'
import { robotsText, sitemapUrl } from '../shared/sitemap'

describe('sitemap discovery', () => {
  it('keeps private routes excluded, shuts out SEO-tool crawlers and advertises the index', () => {
    expect(robotsText('https://psray.net/sitemap.xml')).toBe([
      'User-agent: *',
      'Disallow: /admin',
      'Disallow: /settings',
      'Disallow: /me',
      'Disallow: /sync',
      'Disallow: /auth',
      '',
      'User-agent: AhrefsBot',
      'User-agent: DotBot',
      'User-agent: MJ12bot',
      'User-agent: SemrushBot',
      'Disallow: /',
      '',
      'Sitemap: https://psray.net/sitemap.xml',
      '',
    ].join('\n'))
    expect(() => sitemapUrl('javascript:alert(1)')).toThrow()
  })
})
