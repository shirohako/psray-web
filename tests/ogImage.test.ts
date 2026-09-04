import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { UNDECODABLE, fitWithin, imageSize, pngPlease, sniffImageType } from '../server/utils/ogImage'

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

describe('intrinsic size', () => {
  it('reads PNG and JPEG headers', () => {
    expect(imageSize(at('../public/logo.png'))).toEqual({ width: 256, height: 256 })
    expect(imageSize(at('../public/images/psray-share.jpg'))).toEqual({ width: 1200, height: 630 })
  })

  it('reads a GIF screen descriptor', () => {
    const gif = Buffer.concat([Buffer.from('GIF89a'), Buffer.from([0x40, 0x01, 0xF0, 0x00]), Buffer.alloc(4)])
    expect(imageSize(gif)).toEqual({ width: 320, height: 240 })
  })

  it('reports nothing for SVG, which the flags arrive as at a fixed size', () => {
    expect(imageSize(at('../public/flags/4x3/de.svg'))).toBeNull()
  })
})

describe('fitting art to its box', () => {
  it('fills the height for a PS5 square', () => {
    expect(fitWithin({ width: 512, height: 512 }, 268, 208)).toEqual({ width: 208, height: 208 })
  })

  it('fills the width for the 320x176 art every older platform ships', () => {
    expect(fitWithin({ width: 320, height: 176 }, 268, 208)).toEqual({ width: 268, height: 147 })
  })

  it('scales small art up so a tile is never half empty', () => {
    expect(fitWithin({ width: 100, height: 100 }, 268, 208)).toEqual({ width: 208, height: 208 })
  })

  it('falls back to a square when the size could not be read', () => {
    expect(fitWithin(null, 268, 208)).toEqual({ width: 208, height: 208 })
    expect(fitWithin({ width: 0, height: 0 }, 268, 208)).toEqual({ width: 208, height: 208 })
  })
})
