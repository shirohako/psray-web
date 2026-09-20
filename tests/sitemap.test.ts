import { describe, expect, it } from 'vitest'
import { trophyLanguageEditions, trophyDefaultLanguage } from '../shared/locales'
import { robotsText, sitemapUrl } from '../shared/sitemap'

describe('sitemap discovery', () => {
  it('keeps private routes excluded and advertises the configured API index', () => {
    expect(robotsText('https://api.example.com/sitemap.xml')).toBe('User-agent: *\nDisallow: /settings\nDisallow: /sync\nDisallow: /auth\nSitemap: https://api.example.com/sitemap.xml\n')
    expect(() => sitemapUrl('javascript:alert(1)')).toThrow()
  })
})

describe('trophy sitemap language contract', () => {
  it('advertises only actual languages and preserves regional variants', () => {
    expect(trophyLanguageEditions(['ja-JP', 'en-US', 'en-GB', 'fr-FR', 'es-419', 'fr-FR'])).toEqual([
      { hreflang: 'ja-JP', lang: 'ja', contentLang: 'ja-JP' },
      { hreflang: 'en-US', lang: 'ja', contentLang: 'en-US' },
      { hreflang: 'en-GB', lang: 'ja', contentLang: 'en-GB' },
      { hreflang: 'fr-FR', lang: 'ja', contentLang: 'fr-FR' },
      { hreflang: 'es', lang: 'ja', contentLang: 'es-419' },
    ])
  })
  it('resolves x-default like the detail endpoint, including missing translation headers', () => {
    expect(trophyDefaultLanguage(['en-US', 'fr-FR'], 'fr-FR')).toBe('fr-FR')
    expect(trophyDefaultLanguage(['en-US'], 'ja-JP')).toBe('en-US')
    expect(trophyDefaultLanguage([], 'ja-JP')).toBe('ja-JP')
    expect(trophyDefaultLanguage(['en-US', 'ja-JP'], 'en-US')).toBe('ja-JP')
  })
})
