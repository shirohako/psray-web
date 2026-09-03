/**
 * Pure image helpers for the social-card renderer, kept apart from `ogRender.ts`
 * so `tests/ogImage.test.ts` can exercise them without loading satori or the
 * native resvg binding.
 */

/**
 * Identify an image by its own bytes.
 *
 * Object storage serves user uploads as `application/octet-stream` often enough
 * that the `Content-Type` header cannot be trusted, and satori sniffs the bytes
 * anyway — so the header is only ever a hint here.
 */
export function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length < 12) return null
  const ascii = bytes.subarray(0, 16).toString('latin1')

  if (ascii.startsWith('\x89PNG\r\n\x1a\n')) return 'image/png'
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg'
  if (ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a')) return 'image/gif'
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'image/webp'
  // ISO-BMFF: the brand sits in the `ftyp` box, right after its 4-byte length.
  if (ascii.slice(4, 8) === 'ftyp') {
    const brand = ascii.slice(8, 12)
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
    return null
  }
  const head = bytes.subarray(0, 256).toString('utf8').trimStart()
  if (head.startsWith('<svg') || head.startsWith('<?xml')) return 'image/svg+xml'
  return null
}

/**
 * The one format satori cannot decode. PNG, JPEG, GIF, WebP and SVG all render;
 * handing it AVIF throws from inside its decoder instead of degrading.
 */
export const UNDECODABLE = new Set(['image/avif'])

/**
 * `image.api.playstation.com` transcodes to AVIF, ignoring `Accept` — but only for
 * a bare URL: any query string at all gets the stored PNG back. Scoped to that one
 * host so custom-avatar URLs, which may be signed, are never rewritten.
 */
export function pngPlease(url: string): string {
  if (url.includes('?')) return url
  try {
    return new URL(url).hostname === 'image.api.playstation.com' ? `${url}?format=png` : url
  }
  catch {
    return url
  }
}
