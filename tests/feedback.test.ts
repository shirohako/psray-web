import { describe, expect, it } from 'vitest'
import {
  collectFeedbackContext,
  feedbackExcerpt,
  feedbackRouteQuery,
  forgetGuestFeedback,
  guestFeedbackToken,
  isHttpsUrl,
  linkifyText,
  parseFeedbackQuery,
  readGuestFeedback,
  rememberGuestFeedback,
  sanitizePageUrl,
} from '~/utils/feedback'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
  }
}

describe('Feedback list query', () => {
  it('reads known filters and ignores the rest', () => {
    expect(parseFeedbackQuery({ type: 'bug', status: 'done', mine: '1', page: '3' }))
      .toEqual({ type: 'bug', status: 'done', mine: true, page: 3 })
    expect(parseFeedbackQuery({ type: 'praise', status: ['nope'], mine: 'yes', page: '-2' }))
      .toEqual({ type: null, status: null, mine: false, page: 1 })
  })

  it('round-trips and leaves defaults out of the URL', () => {
    const state = { type: 'suggestion', status: null, mine: true, page: 2 } as const
    expect(feedbackRouteQuery(state)).toEqual({ mine: '1', type: 'suggestion', page: '2' })
    expect(parseFeedbackQuery(feedbackRouteQuery(state))).toEqual(state)
    expect(feedbackRouteQuery({ type: null, status: null, mine: false, page: 1 })).toEqual({})
  })
})

describe('Feedback text', () => {
  it('turns http(s) URLs into links and keeps the rest as text', () => {
    expect(linkifyText('See https://psray.net/trophies/12 please')).toEqual([
      { type: 'text', value: 'See ' },
      { type: 'link', value: 'https://psray.net/trophies/12' },
      { type: 'text', value: ' please' },
    ])
  })

  it('leaves sentence punctuation and CJK prose out of the link', () => {
    expect(linkifyText('看这里https://example.com/a。谢谢')).toEqual([
      { type: 'text', value: '看这里' },
      { type: 'link', value: 'https://example.com/a' },
      { type: 'text', value: '。谢谢' },
    ])
    expect(linkifyText('(see https://example.com/x).')[1]).toEqual({ type: 'link', value: 'https://example.com/x' })
    expect(linkifyText('https://en.wikipedia.org/wiki/Foo_(bar)')[0]!.value).toBe('https://en.wikipedia.org/wiki/Foo_(bar)')
  })

  it('never links other schemes', () => {
    expect(linkifyText('javascript:alert(1) ftp://x.y')).toEqual([{ type: 'text', value: 'javascript:alert(1) ftp://x.y' }])
    expect(linkifyText('https://')).toEqual([{ type: 'text', value: 'https://' }])
  })

  it('makes one-line excerpts', () => {
    expect(feedbackExcerpt('  line one\n\nline two  ')).toBe('line one line two')
    expect(feedbackExcerpt('x'.repeat(100), 10)).toBe(`${'x'.repeat(10)}…`)
  })

  it('accepts only https image links', () => {
    expect(isHttpsUrl('https://i.example.com/a.png')).toBe(true)
    expect(isHttpsUrl('http://i.example.com/a.png')).toBe(false)
    expect(isHttpsUrl('data:image/png;base64,AAAA')).toBe(false)
    expect(isHttpsUrl('not a url')).toBe(false)
  })
})

describe('Feedback page context', () => {
  it('drops credential-like parameters and the fragment from the page URL', () => {
    expect(sanitizePageUrl('https://psray.net/unsubscribe?token=abc&lang=ja#top')).toBe('https://psray.net/unsubscribe?lang=ja')
    expect(sanitizePageUrl('https://psray.net/auth/register?code=123456&step=2')).toBe('https://psray.net/auth/register?step=2')
    expect(sanitizePageUrl('javascript:alert(1)')).toBeUndefined()
  })

  it('describes the screen, viewport and locale', () => {
    const context = collectFeedbackContext({
      location: { href: 'https://psray.net/games?page=2' },
      screen: { width: 390, height: 844 },
      innerWidth: 390,
      innerHeight: 664,
      devicePixelRatio: 3,
    }, 'zh-Hans')
    expect(context).toMatchObject({
      page_url: 'https://psray.net/games?page=2',
      screen: '390x844@3',
      viewport: '390x664',
      locale: 'zh-Hans',
    })
  })
})

describe('A guest\'s remembered feedback', () => {
  const entry = (id: number) => ({ id, token: `token-${id}`, excerpt: `Item ${id}`, created_at: '2026-10-15T08:00:00+00:00' })

  it('remembers newest first without duplicates, and forgets', () => {
    const storage = memoryStorage()
    rememberGuestFeedback(storage, entry(1))
    rememberGuestFeedback(storage, entry(2))
    rememberGuestFeedback(storage, entry(1))
    expect(readGuestFeedback(storage).map(item => item.id)).toEqual([1, 2])
    expect(guestFeedbackToken(storage, 2)).toBe('token-2')

    forgetGuestFeedback(storage, 1)
    expect(readGuestFeedback(storage).map(item => item.id)).toEqual([2])
    expect(guestFeedbackToken(storage, 1)).toBeNull()
  })

  it('survives corrupt or missing storage', () => {
    expect(readGuestFeedback(memoryStorage({ 'psray:feedback:guest': '{oops' }))).toEqual([])
    expect(readGuestFeedback(memoryStorage({ 'psray:feedback:guest': '[{"id":"x"}]' }))).toEqual([])
    expect(readGuestFeedback(undefined)).toEqual([])
    expect(() => rememberGuestFeedback(undefined, entry(1))).not.toThrow()
  })
})
