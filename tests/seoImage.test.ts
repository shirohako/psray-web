import { describe, expect, it } from 'vitest'
import { SHARE_IMAGE, resolveSeoImage } from '../app/utils/seoImage'

const ALT = 'PSRay — あなたの PSN アシスタント'

describe('SEO social image', () => {
  it('falls back to the brand card, with its known geometry, when a page has no image', () => {
    expect(resolveSeoImage('https://psray.net', {}, ALT)).toEqual({
      url: `https://psray.net${SHARE_IMAGE.path}`,
      alt: ALT,
      width: SHARE_IMAGE.width,
      height: SHARE_IMAGE.height,
      type: SHARE_IMAGE.type,
    })
  })

  it('absolutizes the fallback against the site origin without doubling the slash', () => {
    expect(resolveSeoImage('https://psray.net///', {}, ALT).url)
      .toBe(`https://psray.net${SHARE_IMAGE.path}`)
  })

  it('treats an empty image URL — a page whose data has not loaded — as no image', () => {
    expect(resolveSeoImage('https://psray.net', { url: '' }, ALT).url)
      .toBe(`https://psray.net${SHARE_IMAGE.path}`)
  })

  it('keeps a page-supplied alt over the fallback one', () => {
    expect(resolveSeoImage('https://psray.net', { alt: 'ShionAri のプロフィール' }, ALT).alt)
      .toBe('ShionAri のプロフィール')
  })

  it('advertises no dimensions for an image whose geometry we do not know', () => {
    expect(resolveSeoImage('https://psray.net', {
      url: 'https://image.api.playstation.com/avatar.png',
    }, ALT)).toEqual({
      url: 'https://image.api.playstation.com/avatar.png',
      alt: undefined,
      width: undefined,
      height: undefined,
      type: undefined,
    })
  })

  it('passes a page that does know its own geometry through untouched', () => {
    expect(resolveSeoImage('https://psray.net', {
      url: 'https://cdn.example/og.webp',
      width: 800,
      height: 418,
      type: 'image/webp',
    }, ALT)).toMatchObject({ width: 800, height: 418, type: 'image/webp' })
  })
})
