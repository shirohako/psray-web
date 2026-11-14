import { describe, expect, it } from 'vitest'
import { isAdminUrl, scrubAnalyticsUrl, scrubUmamiPayload } from '../app/utils/analytics'

describe('analytics URL scrubbing', () => {
  it('drops the unsubscribe token from an absolute page URL', () => {
    expect(scrubAnalyticsUrl('https://psray.net/unsubscribe?token=abc.def&lang=en'))
      .toBe('https://psray.net/unsubscribe?lang=en')
  })

  it('keeps a same-origin referrer a path', () => {
    expect(scrubAnalyticsUrl('/unsubscribe?token=abc')).toBe('/unsubscribe')
  })

  it('drops every copy of a repeated token', () => {
    expect(scrubAnalyticsUrl('/unsubscribe?token=a&token=b')).toBe('/unsubscribe')
  })

  it('leaves URLs without private params untouched, byte for byte', () => {
    const url = 'https://psray.net/games?q=final+fantasy&lang=ja#top'
    expect(scrubAnalyticsUrl(url)).toBe(url)
  })

  it('passes empty and missing values through', () => {
    expect(scrubAnalyticsUrl('')).toBe('')
    expect(scrubAnalyticsUrl(undefined)).toBeUndefined()
  })

  it('scrubs both url and referrer of a payload and keeps the rest', () => {
    expect(scrubUmamiPayload('event', {
      website: 'site-id',
      url: 'https://psray.net/unsubscribe?token=abc',
      referrer: '/unsubscribe?token=abc',
      title: 'PSRay',
    })).toEqual({
      website: 'site-id',
      url: 'https://psray.net/unsubscribe',
      referrer: '/unsubscribe',
      title: 'PSRay',
    })
  })
})

describe('admin pages stay out of analytics', () => {
  it('recognises the admin console and its subpages', () => {
    expect(isAdminUrl('https://psray.net/admin')).toBe(true)
    expect(isAdminUrl('https://psray.net/admin/')).toBe(true)
    expect(isAdminUrl('https://psray.net/admin/mail/campaigns/3?tab=log')).toBe(true)
  })

  it('does not match public pages that merely start with the same letters', () => {
    expect(isAdminUrl('https://psray.net/administrator')).toBe(false)
    expect(isAdminUrl('https://psray.net/p/admin')).toBe(false)
    expect(isAdminUrl('https://psray.net/?q=admin')).toBe(false)
    expect(isAdminUrl(undefined)).toBe(false)
  })

  it('cancels the send for an admin page view', () => {
    expect(scrubUmamiPayload('event', { url: 'https://psray.net/admin/queues' })).toBeNull()
  })

  it('still sends a public page reached from the admin console', () => {
    expect(scrubUmamiPayload('event', { url: 'https://psray.net/p/ShionAri', referrer: '/admin/user-data' }))
      .toEqual({ url: 'https://psray.net/p/ShionAri', referrer: '/admin/user-data' })
  })
})
