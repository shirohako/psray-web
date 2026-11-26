import { describe, expect, it } from 'vitest'
import {
  acceptsMarkdown,
  isConvertiblePath,
  markdownSourcePath,
  markdownTokens,
  mergeVary,
  toMarkdownUrl,
  withHtmlFallback,
} from '#shared/markdownAgents'

describe('Markdown negotiation', () => {
  it('accepts text/markdown at any non-zero quality', () => {
    expect(acceptsMarkdown('text/markdown')).toBe(true)
    expect(acceptsMarkdown('text/html, text/markdown;q=0.1')).toBe(true)
    expect(acceptsMarkdown('TEXT/Markdown; charset=utf-8; q=0.5')).toBe(true)
    expect(acceptsMarkdown('text/markdown;q=abc')).toBe(true)
  })

  it('refuses q=0, wildcards and look-alikes', () => {
    expect(acceptsMarkdown('text/markdown;q=0')).toBe(false)
    expect(acceptsMarkdown('text/markdown; q=0.0, text/html')).toBe(false)
    expect(acceptsMarkdown('*/*')).toBe(false)
    expect(acceptsMarkdown('text/*')).toBe(false)
    expect(acceptsMarkdown('text/markdown-x')).toBe(false)
    expect(acceptsMarkdown('')).toBe(false)
    expect(acceptsMarkdown(undefined)).toBe(false)
  })

  it('adds a low-priority text/html only when it is missing', () => {
    expect(withHtmlFallback('text/markdown')).toBe('text/markdown, text/html;q=0.01')
    expect(withHtmlFallback('text/markdown, text/html;q=0.5')).toBe('text/markdown, text/html;q=0.5')
  })

  it('merges Vary without duplicating', () => {
    expect(mergeVary(undefined, 'Accept')).toBe('Accept')
    expect(mergeVary('Accept-Encoding', 'Accept')).toBe('Accept-Encoding, Accept')
    expect(mergeVary('accept, sec-fetch-mode', 'Accept')).toBe('accept, sec-fetch-mode')
    expect(mergeVary('*', 'Accept')).toBe('*')
  })

  it('estimates tokens as UTF-8 bytes / 4', () => {
    expect(markdownTokens('abcd')).toBe(1)
    expect(markdownTokens('あ')).toBe(0)
    expect(markdownTokens('abcdefgh')).toBe(2)
    expect(markdownTokens('トロフィー')).toBe(3)
  })
})

describe('Markdown URLs', () => {
  it('maps .md paths to the page they stand for', () => {
    expect(markdownSourcePath('/index.md')).toBe('/')
    expect(markdownSourcePath('/trophies/1.md')).toBe('/trophies/1')
    expect(markdownSourcePath('/p/some_one.md')).toBe('/p/some_one')
  })

  it('leaves other paths alone', () => {
    expect(markdownSourcePath('/trophies/1')).toBeNull()
    expect(markdownSourcePath('/.md')).toBeNull()
    expect(markdownSourcePath('/trophies/.md')).toBeNull()
    expect(markdownSourcePath('/_nuxt/a.md')).toBeNull()
  })

  it('builds .md URLs keeping query and hash', () => {
    expect(toMarkdownUrl('https://psray.net/')).toBe('https://psray.net/index.md')
    expect(toMarkdownUrl('https://psray.net')).toBe('https://psray.net/index.md')
    expect(toMarkdownUrl('/?lang=en')).toBe('/index.md?lang=en')
    expect(toMarkdownUrl('/trophies/1?lang=en#trophy-2')).toBe('/trophies/1.md?lang=en#trophy-2')
    expect(toMarkdownUrl('https://psray.net/games/')).toBe('https://psray.net/games.md')
  })

  it('only converts public pages', () => {
    for (const path of ['/settings', '/settings/profile', '/me/tips', '/auth/login', '/admin', '/sync', '/sitemap.xml', '/flags/4x3/jp.svg', '/_nuxt/x', '/__nuxt_error'])
      expect(isConvertiblePath(path), path).toBe(false)
    for (const path of ['/', '/meta', '/trophies/42972', '/p/abyssmoe', '/docs/markdown'])
      expect(isConvertiblePath(path), path).toBe(true)
  })
})
