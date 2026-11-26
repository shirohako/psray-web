import { describe, expect, it } from 'vitest'
import {
  MAX_CROP_ZOOM,
  MEDIA_RULES,
  clampCrop,
  cropBackgroundStyle,
  cropBounds,
  cropOutputSize,
  cropRect,
  initialCrop,
  panCrop,
  sliderToZoom,
  zoomCrop,
  zoomToSlider,
} from '~/utils/media'

const banner = MEDIA_RULES.banner
const avatar = MEDIA_RULES.avatar

describe('cropBounds', () => {
  it('takes the full width of a wide photo for a 9:2 banner', () => {
    const bounds = cropBounds(3840, 2160, banner)!
    expect(bounds.maxWidth).toBe(3840)
    // 3840 / 900 ≈ 4.27: the crop may shrink to the API minimum and no further.
    expect(bounds.maxZoom).toBeCloseTo(3840 / 900)
  })

  it('takes the full height when the picture is wider than the ratio', () => {
    const bounds = cropBounds(5000, 400, banner)!
    expect(bounds.maxWidth).toBe(1800)
    expect(bounds.maxZoom).toBe(2)
  })

  it('caps the zoom for huge pictures', () => {
    expect(cropBounds(8000, 8000, avatar)!.maxZoom).toBe(MAX_CROP_ZOOM)
  })

  it('refuses a picture below the minimum', () => {
    expect(cropBounds(800, 600, banner)).toBeNull()
    expect(cropBounds(2000, 190, banner)).toBeNull()
    expect(cropBounds(100, 300, avatar)).toBeNull()
  })

  it('accepts a picture exactly at the minimum, with no zoom', () => {
    const bounds = cropBounds(128, 128, avatar)!
    expect(bounds.maxZoom).toBe(1)
  })
})

describe('crop state', () => {
  const bounds = cropBounds(4000, 3000, avatar)!

  it('starts as the largest centred crop', () => {
    expect(cropRect(initialCrop(bounds), bounds)).toEqual({ x: 500, y: 0, width: 3000, height: 3000 })
  })

  it('keeps the crop inside the picture when panning', () => {
    const state = panCrop(initialCrop(bounds), bounds, -5000, 100)
    expect(cropRect(state, bounds)).toEqual({ x: 0, y: 0, width: 3000, height: 3000 })
  })

  it('keeps the zoom in range', () => {
    expect(clampCrop({ zoom: 0.2, x: 0, y: 0 }, bounds).zoom).toBe(1)
    expect(clampCrop({ zoom: 99, x: 0, y: 0 }, bounds).zoom).toBe(bounds.maxZoom)
  })

  it('zooms around the anchor so it stays put on screen', () => {
    const start = initialCrop(bounds)
    const anchor = { x: 1000, y: 1000 }
    const zoomed = zoomCrop(start, bounds, 2, anchor)
    const before = cropRect(start, bounds)
    const after = cropRect(zoomed, bounds)
    // Same relative position inside the crop before and after.
    expect((anchor.x - after.x) / after.width).toBeCloseTo((anchor.x - before.x) / before.width)
    expect((anchor.y - after.y) / after.height).toBeCloseTo((anchor.y - before.y) / before.height)
  })

  it('maps the slider on a log scale', () => {
    expect(sliderToZoom(0, bounds)).toBe(1)
    expect(sliderToZoom(1, bounds)).toBeCloseTo(bounds.maxZoom)
    expect(zoomToSlider(sliderToZoom(0.37, bounds), bounds)).toBeCloseTo(0.37)
  })
})

describe('cropOutputSize', () => {
  it('scales big crops down to the output size', () => {
    expect(cropOutputSize(3840, banner)).toEqual({ width: 2880, height: 640 })
    expect(cropOutputSize(3000, avatar)).toEqual({ width: 512, height: 512 })
  })

  it('keeps smaller crops at their size, with an exact ratio', () => {
    expect(cropOutputSize(1000, banner)).toEqual({ width: 999, height: 222 })
    expect(cropOutputSize(300.6, avatar)).toEqual({ width: 300, height: 300 })
  })

  it('never goes below the API minimum', () => {
    expect(cropOutputSize(899.99, banner)).toEqual({ width: 900, height: 200 })
    expect(cropOutputSize(127.9, avatar)).toEqual({ width: 128, height: 128 })
  })
})

describe('cropBackgroundStyle', () => {
  it('shows the crop with a percent size and position', () => {
    const style = cropBackgroundStyle({ x: 1000, y: 500, width: 2000, height: 1000 }, 4000, 3000, 'blob:x')
    expect(style.backgroundSize).toBe('200% auto')
    expect(style.backgroundPosition).toBe('50% 25%')
  })

  it('centres an axis the crop fills completely', () => {
    const style = cropBackgroundStyle({ x: 0, y: 0, width: 4000, height: 3000 }, 4000, 3000, 'blob:x')
    expect(style.backgroundPosition).toBe('50% 50%')
  })
})
