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

export interface Size {
  width: number
  height: number
}

/**
 * Read an image's intrinsic size from its header.
 *
 * The cards need this because trophy-set art is not one shape: PS5 sets ship a
 * 512×512 square, while PS3, PS4 and Vita sets ship a 320×176 landscape. Drawing
 * both into the same square box stretches every older cover vertically.
 *
 * Returns `null` for anything it cannot read — SVG included, since the flags that
 * arrive that way are drawn at a fixed size anyway.
 */
export function imageSize(bytes: Buffer): Size | null {
  const type = sniffImageType(bytes)

  if (type === 'image/png' && bytes.length >= 24) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  }

  if (type === 'image/gif' && bytes.length >= 10) {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) }
  }

  if (type === 'image/jpeg') return jpegSize(bytes)
  if (type === 'image/webp') return webpSize(bytes)

  return null
}

/** Walk the marker segments to the frame header, which is the only one that carries the size. */
function jpegSize(bytes: Buffer): Size | null {
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xFF) return null
    const marker = bytes[offset + 1]!
    // SOF0–SOF15 hold the dimensions; SOF4/8/12 are not frame headers.
    if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) }
    }
    if (marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD9)) {
      offset += 2
      continue
    }
    offset += 2 + bytes.readUInt16BE(offset + 2)
  }
  return null
}

/** WebP stores its size differently in each of its three chunk layouts. */
function webpSize(bytes: Buffer): Size | null {
  const chunk = bytes.subarray(12, 16).toString('latin1')

  if (chunk === 'VP8X' && bytes.length >= 30) {
    return {
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    }
  }

  if (chunk === 'VP8 ' && bytes.length >= 30) {
    // Past the 3-byte sync code, the size is two 14-bit little-endian fields.
    return {
      width: bytes.readUInt16LE(26) & 0x3FFF,
      height: bytes.readUInt16LE(28) & 0x3FFF,
    }
  }

  if (chunk === 'VP8L' && bytes.length >= 25) {
    // Bit-packed after the 0x2F signature: 14 bits of width-1, then 14 of height-1.
    const bits = bytes.readUInt32LE(21)
    return {
      width: (bits & 0x3FFF) + 1,
      height: ((bits >> 14) & 0x3FFF) + 1,
    }
  }

  return null
}

/**
 * Scale a natural size to fill as much of a box as it can without distorting.
 * Small art is scaled up so a tile never sits half-empty next to a full one.
 */
export function fitWithin(natural: Size | null, maxWidth: number, maxHeight: number): Size {
  if (!natural || natural.width <= 0 || natural.height <= 0) return { width: maxHeight, height: maxHeight }
  const scale = Math.min(maxWidth / natural.width, maxHeight / natural.height)
  return {
    width: Math.round(natural.width * scale),
    height: Math.round(natural.height * scale),
  }
}
