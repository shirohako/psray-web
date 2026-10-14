import { describe, expect, it } from 'vitest'
import { dominantColor, hexToRgb, oklchToHex, paletteFromColor, rgbToOklch } from '~/utils/color'

/** RGBA pixels: `count` copies of each colour. */
function pixels(...runs: [string, number][]) {
  return runs.flatMap(([hex, count]) => Array.from({ length: count }, () => [...hexToRgb(hex)!, 255]).flat())
}

const hue = (hex: string) => rgbToOklch(hexToRgb(hex)!).h
const chroma = (hex: string) => rgbToOklch(hexToRgb(hex)!).c

describe('colour conversion', () => {
  it('round-trips through OKLCH', () => {
    for (const hex of ['#cdb4db', '#a2d2ff', '#252a34', '#ff2e63']) {
      const { l, c, h } = rgbToOklch(hexToRgb(hex)!)
      expect(oklchToHex(l, c, h)).toBe(hex)
    }
  })

  it('pulls out-of-gamut colours back into sRGB', () => {
    expect(oklchToHex(0.9, 0.4, 260)).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('palette from a colour', () => {
  it('keeps the hue at the cover families’ lightness steps', () => {
    const palette = paletteFromColor('#d4a017')!
    for (const color of Object.values(palette)) expect(Math.abs(hue(color) - hue('#d4a017'))).toBeLessThan(6)
    expect(rgbToOklch(hexToRgb(palette.bg)!).l).toBeCloseTo(0.945, 2)
    expect(rgbToOklch(hexToRgb(palette.text)!).l).toBeCloseTo(0.36, 2)
  })

  it('stays near grey for a grey source', () => {
    expect(chroma(paletteFromColor('#808080')!.shape)).toBeLessThan(0.015)
  })

  it('rejects anything but #rrggbb', () => {
    expect(paletteFromColor('gold')).toBeNull()
  })
})

describe('dominant colour', () => {
  it('lets a strong hue win over a dark, murky majority', () => {
    // Mostly near-black and grey, with a band of gold: the cover reads as gold.
    const color = dominantColor(pixels(['#101418', 700], ['#3a3f44', 200], ['#e0a838', 100]))
    expect(Math.abs(hue(color) - hue('#e0a838'))).toBeLessThan(10)
  })

  it('returns a grey for a picture without colour', () => {
    expect(chroma(dominantColor(pixels(['#202020', 500], ['#d0d0d0', 500])))).toBeLessThan(0.01)
  })

  it('ignores transparent pixels', () => {
    const color = dominantColor([...pixels(['#2e7dd7', 10]), 255, 0, 0, 0])
    expect(Math.abs(hue(color) - hue('#2e7dd7'))).toBeLessThan(10)
  })
})
