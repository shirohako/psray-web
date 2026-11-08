import { describe, expect, it } from 'vitest'
import { withLang } from '#shared/langLink'

describe('withLang', () => {
  it('appends the interface language after the target\'s own params', () => {
    expect(withLang('/trophies/1', 'en')).toBe('/trophies/1?lang=en')
    expect(withLang('/trophies?category=new', 'zh-Hans')).toBe('/trophies?category=new&lang=zh-Hans')
    expect(withLang('/trophies/1#trophy-5', 'ko')).toBe('/trophies/1?lang=ko#trophy-5')
    expect(withLang({ path: '/p/x', query: { page: '2' } }, 'en')).toEqual({ path: '/p/x', query: { page: '2', lang: 'en' } })
    expect(withLang({ path: '/games' }, 'en')).toEqual({ path: '/games', query: { lang: 'en' } })
  })

  it('adds nothing for Japanese, the bare URL', () => {
    expect(withLang('/trophies/1', 'ja')).toBe('/trophies/1')
    expect(withLang({ path: '/games' }, 'ja')).toEqual({ path: '/games' })
  })

  it('leaves external targets and explicit languages alone', () => {
    expect(withLang('https://example.com/x', 'en')).toBe('https://example.com/x')
    expect(withLang('//example.com/x', 'en')).toBe('//example.com/x')
    expect(withLang('mailto:a@b.c', 'en')).toBe('mailto:a@b.c')
    expect(withLang('#top', 'en')).toBe('#top')
    expect(withLang('/trophies/1?lang=ko', 'en')).toBe('/trophies/1?lang=ko')
    const bare = { path: '/', query: { lang: undefined } }
    expect(withLang(bare, 'en')).toBe(bare)
  })
})
