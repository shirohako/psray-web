import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { UNDECODABLE, pngPlease, sniffImageType } from '../server/utils/ogImage'

const at = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)))

describe('social-card image sniffing', () => {
  it('identifies the formats the cards actually pull in', () => {
    expect(sniffImageType(at('../public/logo.png'))).toBe('image/png')
    expect(sniffImageType(at('../public/images/psray-share.jpg'))).toBe('image/jpeg')
    expect(sniffImageType(at('../public/flags/4x3/de.svg'))).toBe('image/svg+xml')
  })

  it('accepts WebP, which satori renders and custom avatars are often stored as', () => {
    // RIFF container: the tag, a length, then the `WEBP` form type.
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')])
    expect(sniffImageType(webp)).toBe('image/webp')
    expect(UNDECODABLE.has('image/webp')).toBe(false)
  })

  it('flags AVIF, the one format satori throws on rather than degrades', () => {
    // ISO-BMFF: 4-byte box length, `ftyp`, then the brand.
    const avif = Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from('ftypavif')])
    expect(sniffImageType(avif)).toBe('image/avif')
    expect(UNDECODABLE.has('image/avif')).toBe(true)
  })

  it('reports nothing for truncated or non-image bytes', () => {
    expect(sniffImageType(Buffer.from([1, 2, 3]))).toBeNull()
    expect(sniffImageType(Buffer.alloc(64, 7))).toBeNull()
  })

  it('asks only the PSN host that needs it for a non-AVIF encoding', () => {
    expect(pngPlease('https://image.api.playstation.com/trophy/np/x.PNG'))
      .toBe('https://image.api.playstation.com/trophy/np/x.PNG?format=png')
  })

  it('leaves every other URL alone, so signed uploads keep working', () => {
    for (const url of [
      'https://cdn.example.com/avatars/u1.webp',
      'https://image.api.playstation.com/trophy/np/x.PNG?sig=abc',
      'not a url at all',
    ]) {
      expect(pngPlease(url)).toBe(url)
    }
  })
})
