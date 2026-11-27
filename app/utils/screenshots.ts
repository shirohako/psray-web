/**
 * Game screenshots: upload rules and the helpers around them.
 *
 * The rules mirror psray-api `App\Support\MediaPurpose::Screenshot` and
 * `config/media.php` (docs/media.md "用途"): change them together. The API
 * keeps the picture's ratio, scales the long side down to 2560 and stores
 * WebP. The browser does the same scaling first when a picture is bigger
 * (a 4K PNG uploads as a ~1 MB WebP instead of ~15 MB), and converts what the
 * API can't decode (HEIC, AVIF) when it can.
 */
import { drawCrop, encodeCrop, formatFileSize, loadImageFile } from '~/utils/media'

const MB = 1024 * 1024
const GB = 1024 * MB

export const SCREENSHOT_RULE = {
  /** The API's limit on an uploaded file. */
  maxBytes: 20 * MB,
  /** Long side the API scales down to. */
  maxSide: 2560,
  /** Smallest picture the API takes, [width, height]. */
  minSize: [320, 180] as [number, number],
  /** What the API decodes itself; anything else is converted in the browser. */
  types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as readonly string[],
}

/** Longest caption, in characters. */
export const SCREENSHOT_CAPTION_MAX = 100

/**
 * Files above this are refused before they are decoded: what gets uploaded is
 * at most 20 MB anyway, so this only guards the browser's memory.
 */
export const SCREENSHOT_SOURCE_MAX_BYTES = 80 * MB

export type ScreenshotPrepareError = 'notImage' | 'tooLarge' | 'tooSmall'

export class ScreenshotFileError extends Error {
  constructor(public readonly reason: ScreenshotPrepareError) {
    super(reason)
  }
}

/**
 * Whether a picture goes up as it is or is redrawn in the browser first:
 * redrawn when the API couldn't read the format, the file is over its limit,
 * or the API would scale it down anyway.
 */
export function screenshotNeedsRedraw(file: { type: string, size: number }, width: number, height: number): boolean {
  return !SCREENSHOT_RULE.types.includes(file.type)
    || file.size > SCREENSHOT_RULE.maxBytes
    || Math.max(width, height) > SCREENSHOT_RULE.maxSide
}

/** The size a picture is redrawn at: long side at most 2560, never enlarged. */
export function screenshotOutputSize(width: number, height: number): { width: number, height: number } {
  const scale = Math.min(1, SCREENSHOT_RULE.maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * The blob to upload for a picked file, or a {@link ScreenshotFileError}.
 * Small enough pictures in a format the API reads go up untouched, so they
 * are only encoded once.
 */
export async function prepareScreenshot(file: File): Promise<Blob> {
  if (file.size > SCREENSHOT_SOURCE_MAX_BYTES) throw new ScreenshotFileError('tooLarge')

  let loaded: Awaited<ReturnType<typeof loadImageFile>>
  try {
    loaded = await loadImageFile(file)
  }
  catch {
    throw new ScreenshotFileError('notImage')
  }
  const { image, url } = loaded
  try {
    const { naturalWidth: width, naturalHeight: height } = image
    const [minWidth, minHeight] = SCREENSHOT_RULE.minSize
    if (width < minWidth || height < minHeight) throw new ScreenshotFileError('tooSmall')
    if (!screenshotNeedsRedraw(file, width, height)) return file

    const size = screenshotOutputSize(width, height)
    const canvas = drawCrop(image, { x: 0, y: 0, width, height }, size.width, size.height)
    try {
      return await encodeCrop(canvas, SCREENSHOT_RULE.maxBytes)
    }
    catch {
      throw new ScreenshotFileError('tooLarge')
    }
  }
  finally {
    URL.revokeObjectURL(url)
  }
}

/** `1.24 GB`, `312.5 MB`, `48 KB`. */
export function formatStorage(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(2).replace(/\.?0+$/, '')} GB`
  return formatFileSize(bytes)
}

/** Share of a limit used, 0–1; `null` when there is no limit. */
export function usageShare(used: number, limit: number): number | null {
  if (limit <= 0) return null
  return Math.min(1, Math.max(0, used / limit))
}

// ── Upload choices, remembered on this device ────────────────────────────────

export interface ScreenshotUploadDefaults {
  isPublic: boolean
  watermarkPsn: boolean
  watermarkProfile: boolean
}

export const SCREENSHOT_DEFAULTS_KEY = 'psray:screenshot-upload'

/** First visit: public, no watermarks. */
export const SCREENSHOT_DEFAULTS: ScreenshotUploadDefaults = { isPublic: true, watermarkPsn: false, watermarkProfile: false }

/** Reads what was stored, falling back field by field on anything unexpected. */
export function parseUploadDefaults(raw: string | null): ScreenshotUploadDefaults {
  let stored: unknown
  try {
    stored = raw ? JSON.parse(raw) : null
  }
  catch {
    stored = null
  }
  const value = (stored && typeof stored === 'object' ? stored : {}) as Record<string, unknown>
  const flag = (key: keyof ScreenshotUploadDefaults) => (typeof value[key] === 'boolean' ? value[key] as boolean : SCREENSHOT_DEFAULTS[key])
  return { isPublic: flag('isPublic'), watermarkPsn: flag('watermarkPsn'), watermarkProfile: flag('watermarkProfile') }
}
