/**
 * Rules for the images users upload, and the maths behind the crop dialog.
 *
 * The rules mirror psray-api `App\Support\MediaPurpose` (docs/media.md
 * "用途"): change them together. The browser crops and scales the picture to
 * the purpose's ratio and output size before uploading, so the user decides
 * what is kept, and formats the API can't decode (HEIC, AVIF) still work when
 * the browser can.
 *
 * Crop geometry is kept in source pixels, independent of how big the crop
 * stage is on screen: `zoom` 1 is the largest crop the picture allows, and
 * `x` / `y` is the centre of the crop.
 */

export type UserMediaPurpose = 'avatar' | 'banner'

export interface MediaRule {
  /** Width : height the picture is cropped to. */
  aspect: [number, number]
  /** Smallest image the API accepts, [width, height]. */
  minSize: [number, number]
  /** The API's largest variant; uploads are scaled down to fit it, never up. */
  outputSize: [number, number]
  /** The API's limit on the uploaded file. */
  maxBytes: number
}

const MB = 1024 * 1024

export const MEDIA_RULES: Record<UserMediaPurpose, MediaRule> = {
  avatar: { aspect: [1, 1], minSize: [128, 128], outputSize: [512, 512], maxBytes: 5 * MB },
  banner: { aspect: [9, 2], minSize: [900, 200], outputSize: [2880, 640], maxBytes: 8 * MB },
}

/**
 * Picked files above this are refused before they are decoded. What gets
 * uploaded is the much smaller cropped copy, so this only guards the
 * browser's memory.
 */
export const MEDIA_SOURCE_MAX_BYTES = 40 * MB

/** How far in the zoom goes at most, relative to the largest crop. */
export const MAX_CROP_ZOOM = 8

export interface CropBounds {
  imageWidth: number
  imageHeight: number
  /** Width / height of the crop. */
  ratio: number
  /** Width of the largest crop the picture allows (zoom 1). */
  maxWidth: number
  /** Highest zoom: the crop can't get smaller than the API's minimum size. */
  maxZoom: number
}

export interface CropState {
  zoom: number
  /** Centre of the crop, in source pixels. */
  x: number
  y: number
}

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The crop limits for a picture of this size, or `null` when even the
 * largest crop would be below the API's minimum (the picture is too small).
 */
export function cropBounds(imageWidth: number, imageHeight: number, rule: MediaRule): CropBounds | null {
  const ratio = rule.aspect[0] / rule.aspect[1]
  const maxWidth = Math.min(imageWidth, imageHeight * ratio)
  // The crop width at which both sides reach the minimum.
  const minWidth = Math.max(rule.minSize[0], rule.minSize[1] * ratio)
  if (maxWidth < minWidth) return null
  return { imageWidth, imageHeight, ratio, maxWidth, maxZoom: Math.min(MAX_CROP_ZOOM, maxWidth / minWidth) }
}

/** Largest crop, centred. */
export function initialCrop(bounds: CropBounds): CropState {
  return { zoom: 1, x: bounds.imageWidth / 2, y: bounds.imageHeight / 2 }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Keeps the zoom in range and the crop inside the picture. */
export function clampCrop(state: CropState, bounds: CropBounds): CropState {
  const zoom = clamp(state.zoom, 1, bounds.maxZoom)
  const width = bounds.maxWidth / zoom
  const height = width / bounds.ratio
  return {
    zoom,
    x: clamp(state.x, width / 2, bounds.imageWidth - width / 2),
    y: clamp(state.y, height / 2, bounds.imageHeight - height / 2),
  }
}

/** The cropped area in source pixels. */
export function cropRect(state: CropState, bounds: CropBounds): CropRect {
  const width = bounds.maxWidth / state.zoom
  const height = width / bounds.ratio
  return { x: state.x - width / 2, y: state.y - height / 2, width, height }
}

/** Moves the crop by a distance in source pixels. */
export function panCrop(state: CropState, bounds: CropBounds, dx: number, dy: number): CropState {
  return clampCrop({ ...state, x: state.x + dx, y: state.y + dy }, bounds)
}

/**
 * Zooms so that `anchor` (a source point, e.g. under the cursor) stays where
 * it is on screen. Without an anchor it zooms around the crop's centre.
 */
export function zoomCrop(state: CropState, bounds: CropBounds, zoom: number, anchor?: { x: number, y: number }): CropState {
  const next = clamp(zoom, 1, bounds.maxZoom)
  if (!anchor) return clampCrop({ ...state, zoom: next }, bounds)
  const keep = state.zoom / next
  return clampCrop({
    zoom: next,
    x: anchor.x - (anchor.x - state.x) * keep,
    y: anchor.y - (anchor.y - state.y) * keep,
  }, bounds)
}

/**
 * The zoom slider moves on a log scale, so each step feels the same at
 * either end. 0 → zoom 1, 1 → `maxZoom`.
 */
export function zoomToSlider(zoom: number, bounds: CropBounds): number {
  return bounds.maxZoom > 1 ? Math.log(zoom) / Math.log(bounds.maxZoom) : 0
}

export function sliderToZoom(value: number, bounds: CropBounds): number {
  return bounds.maxZoom ** clamp(value, 0, 1)
}

/**
 * Size of the uploaded image for a crop: the crop's own size, scaled down to
 * the purpose's output size, in whole multiples of the aspect so the ratio is
 * exact (the API would otherwise trim a pixel off-centre).
 */
export function cropOutputSize(cropWidth: number, rule: MediaRule): { width: number, height: number } {
  const [aw, ah] = rule.aspect
  const minUnits = Math.max(Math.ceil(rule.minSize[0] / aw), Math.ceil(rule.minSize[1] / ah))
  const maxUnits = Math.floor(Math.min(rule.outputSize[0] / aw, rule.outputSize[1] / ah))
  const units = clamp(Math.floor(cropWidth / aw), minUnits, maxUnits)
  return { width: units * aw, height: units * ah }
}

/**
 * CSS that shows `rect` of a `imageWidth`×`imageHeight` picture filling a box
 * of the crop's ratio, at any box size: a background in percent.
 */
export function cropBackgroundStyle(rect: CropRect, imageWidth: number, imageHeight: number, url: string): Record<string, string> {
  const position = (offset: number, size: number, image: number) =>
    image - size > 0.5 ? `${(offset / (image - size)) * 100}%` : '50%'
  return {
    backgroundImage: `url("${url}")`,
    backgroundSize: `${(imageWidth / rect.width) * 100}% auto`,
    backgroundPosition: `${position(rect.x, rect.width, imageWidth)} ${position(rect.y, rect.height, imageHeight)}`,
    backgroundRepeat: 'no-repeat',
  }
}

/** Reads a picked file into an `<img>` (oriented by its EXIF, like the browser shows it). */
export async function loadImageFile(file: File): Promise<{ image: HTMLImageElement, url: string }> {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.src = url
  try {
    await image.decode()
  }
  catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
  if (!image.naturalWidth || !image.naturalHeight) {
    URL.revokeObjectURL(url)
    throw new Error('The image has no size')
  }
  return { image, url }
}

function canvasOf(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return [canvas, ctx]
}

/**
 * Draws `rect` of the picture at `width`×`height`. Big reductions go in
 * halving steps: one large jump looks grainy in some browsers.
 */
export function drawCrop(source: CanvasImageSource, rect: CropRect, width: number, height: number): HTMLCanvasElement {
  let current: CanvasImageSource = source
  let { x, y, width: sw, height: sh } = rect
  while (sw / 2 > width && sh / 2 > height) {
    const w = Math.round(sw / 2)
    const h = Math.round(sh / 2)
    const [step, ctx] = canvasOf(w, h)
    ctx.drawImage(current, x, y, sw, sh, 0, 0, w, h)
    current = step
    x = 0
    y = 0
    sw = w
    sh = h
  }
  const [canvas, ctx] = canvasOf(width, height)
  ctx.drawImage(current, x, y, sw, sh, 0, 0, width, height)
  return canvas
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

/**
 * Encodes the cropped picture for upload. The API re-encodes everything to
 * WebP, so this aims for near-lossless: WebP at high quality, else PNG
 * (browsers that can't write WebP), else JPEG when PNG would be too big.
 */
export async function encodeCrop(canvas: HTMLCanvasElement, maxBytes: number): Promise<Blob> {
  const webp = await toBlob(canvas, 'image/webp', 0.95)
  if (webp && webp.type === 'image/webp' && webp.size <= maxBytes) return webp
  const png = await toBlob(canvas, 'image/png')
  if (png && png.size <= maxBytes) return png
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.92)
  if (jpeg && jpeg.size <= maxBytes) return jpeg
  throw new Error('The cropped image is too large')
}

/** `1.2 MB`, `312 KB`. */
export function formatFileSize(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
