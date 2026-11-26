import { describe, expect, it } from 'vitest'
import { llmsText } from '#shared/llmsTxt'

describe('llms.txt', () => {
  const text = llmsText({ siteUrl: 'https://psray.net/', sitemapUrl: 'https://psray.net/sitemap.xml' })

  it('follows the llmstxt.org layout', () => {
    const lines = text.split('\n')
    expect(lines[0]).toBe('# PSRay')
    expect(lines[2]).toMatch(/^> PSRay is a community site/)
    expect(text).toContain('\n## Sections\n')
    expect(text).toContain('\n## Optional\n')
    expect(text.endsWith('\n')).toBe(true)
  })

  it('links the Markdown form of each section', () => {
    expect(text).toContain('[Home](https://psray.net/index.md?lang=en)')
    expect(text).toContain('[Trophy lists](https://psray.net/trophies.md?lang=en)')
    expect(text).toContain('[Terms of service](https://psray.net/terms.md)')
    expect(text).toContain('https://psray.net/trophies/{id}.md')
    expect(text).toContain('[API documentation](https://psray.net/docs/api.md?lang=en)')
    expect(text).toContain('[Sitemap](https://psray.net/sitemap.xml)')
  })
})
