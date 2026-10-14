/**
 * Colour helpers for the game page's drawn art (auto-imported like the other
 * `utils/` files; framework-free so the unit tests can load it).
 *
 * Works in OKLCH so a palette built from any hue keeps the same perceived
 * lightness as the hand-picked cover families in `game.ts`.
 */

/** The five colours a drawn cover or banner is painted with. */
export interface ArtPalette {
  bg: string
  shape: string
  accent: string
  band: string
  text: string
}

type Rgb = [number, number, number]

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

/** sRGB (0–255) to OKLab. */
function rgbToOklab([r, g, b]: Rgb): [number, number, number] {
  const [lr, lg, lb] = [r, g, b].map(c => toLinear(c / 255)) as Rgb
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLab to linear sRGB, unclamped (components outside 0–1 mean out of gamut). */
function oklabToLinear(L: number, a: number, b: number): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const value = Number.parseInt(match[1]!, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

/** Lightness, chroma and hue (degrees) of an sRGB colour. */
export function rgbToOklch(rgb: Rgb): { l: number, c: number, h: number } {
  const [l, a, b] = rgbToOklab(rgb)
  return { l, c: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 }
}

/** An OKLCH colour as `#rrggbb`, lowering the chroma until it fits in sRGB. */
export function oklchToHex(l: number, c: number, h: number): string {
  const radians = (h * Math.PI) / 180
  let chroma = c
  let rgb = oklabToLinear(l, chroma * Math.cos(radians), chroma * Math.sin(radians))
  while (chroma > 0 && rgb.some(value => value < -0.0001 || value > 1.0001)) {
    chroma = Math.max(0, chroma - 0.005)
    rgb = oklabToLinear(l, chroma * Math.cos(radians), chroma * Math.sin(radians))
  }
  return `#${rgb.map(value => Math.round(toGamma(Math.min(1, Math.max(0, value))) * 255).toString(16).padStart(2, '0')).join('')}`
}

/**
 * A drawn-art palette in the hue of `color`, at the same lightness steps as
 * the cover families (pale background, mid symbol, deeper texture and band,
 * dark text). A greyish source gives a greyish palette instead of an invented hue.
 */
export function paletteFromColor(color: string): ArtPalette | null {
  const rgb = hexToRgb(color)
  if (!rgb) return null
  const { c, h } = rgbToOklch(rgb)
  // Full pastel strength from a chroma of .1 up; near-grey sources fade towards neutral.
  const strength = Math.min(1, Math.max(0.12, c / 0.1))
  return {
    bg: oklchToHex(0.945, 0.03 * strength, h),
    shape: oklchToHex(0.84, 0.075 * strength, h),
    accent: oklchToHex(0.75, 0.1 * strength, h),
    band: oklchToHex(0.79, 0.085 * strength, h),
    text: oklchToHex(0.36, 0.075 * strength, h),
  }
}

/**
 * The colour a picture reads as, from its RGBA pixels (e.g. a downscaled
 * canvas). Pixels vote by hue (30° bins) weighted by chroma, so a cover that
 * is mostly dark with a strong gold glow comes out gold rather than murky;
 * the winning bin's pixels are averaged. Returns a grey when the picture has
 * hardly any colour.
 */
export function dominantColor(pixels: ArrayLike<number>): string {
  const BINS = 12
  const bins = Array.from({ length: BINS }, () => ({ weight: 0, a: 0, b: 0, l: 0 }))
  let lightness = 0
  let count = 0
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    if (pixels[index + 3]! < 128) continue
    const [l, a, b] = rgbToOklab([pixels[index]!, pixels[index + 1]!, pixels[index + 2]!])
    lightness += l
    count++
    const chroma = Math.hypot(a, b)
    // Near-black, near-white and grey pixels carry no hue worth voting for.
    if (chroma < 0.03 || l < 0.2 || l > 0.95) continue
    const hue = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
    const bin = bins[Math.floor(hue / (360 / BINS)) % BINS]!
    bin.weight += chroma
    bin.a += a * chroma
    bin.b += b * chroma
    bin.l += l * chroma
  }
  const best = bins.reduce((top, bin) => (bin.weight > top.weight ? bin : top))
  if (!count || best.weight < count * 0.004) return oklchToHex(count ? lightness / count : 0.6, 0, 0)
  const a = best.a / best.weight
  const b = best.b / best.weight
  return oklchToHex(best.l / best.weight, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360)
}
