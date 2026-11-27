import { describe, expect, it } from 'vitest'
import {
  SCREENSHOT_DEFAULTS,
  formatStorage,
  parseUploadDefaults,
  screenshotNeedsRedraw,
  screenshotOutputSize,
  usageShare,
} from '~/utils/screenshots'
import { myScreenshotsRouteQuery, parseMyScreenshotsQuery } from '~/utils/me'

const MB = 1024 * 1024

describe('screenshot uploads', () => {
  it('sends small pictures in formats the API reads as they are', () => {
    expect(screenshotNeedsRedraw({ type: 'image/png', size: 5 * MB }, 1920, 1080)).toBe(false)
    expect(screenshotNeedsRedraw({ type: 'image/jpeg', size: MB }, 2560, 1440)).toBe(false)
    expect(screenshotNeedsRedraw({ type: 'image/webp', size: MB }, 1080, 2560)).toBe(false)
  })

  it('redraws what the API would shrink, refuse or fail to decode', () => {
    expect(screenshotNeedsRedraw({ type: 'image/png', size: 12 * MB }, 3840, 2160)).toBe(true)
    expect(screenshotNeedsRedraw({ type: 'image/png', size: 25 * MB }, 1920, 1080)).toBe(true)
    expect(screenshotNeedsRedraw({ type: 'image/heic', size: 2 * MB }, 1920, 1080)).toBe(true)
    expect(screenshotNeedsRedraw({ type: 'image/avif', size: MB }, 800, 600)).toBe(true)
  })

  it('scales the long side down to 2560 without enlarging', () => {
    expect(screenshotOutputSize(3840, 2160)).toEqual({ width: 2560, height: 1440 })
    expect(screenshotOutputSize(2160, 3840)).toEqual({ width: 1440, height: 2560 })
    expect(screenshotOutputSize(1920, 1080)).toEqual({ width: 1920, height: 1080 })
  })
})

describe('screenshot storage', () => {
  it('formats sizes from KB to GB', () => {
    expect(formatStorage(48 * 1024)).toBe('48 KB')
    expect(formatStorage(312.5 * MB)).toBe('312.5 MB')
    expect(formatStorage(1.24 * 1024 * MB)).toBe('1.24 GB')
    expect(formatStorage(2 * 1024 * MB)).toBe('2 GB')
    expect(formatStorage(1.5 * 1024 * MB)).toBe('1.5 GB')
  })

  it('reports the share of a limit, or none without one', () => {
    expect(usageShare(128, 500)).toBeCloseTo(0.256)
    expect(usageShare(600, 500)).toBe(1)
    expect(usageShare(10, 0)).toBeNull()
  })
})

describe('remembered upload choices', () => {
  it('starts public without watermarks', () => {
    expect(parseUploadDefaults(null)).toEqual(SCREENSHOT_DEFAULTS)
    expect(SCREENSHOT_DEFAULTS).toEqual({ isPublic: true, watermarkPsn: false, watermarkProfile: false })
  })

  it('reads what was stored and falls back field by field', () => {
    expect(parseUploadDefaults('{"isPublic":false,"watermarkPsn":true,"watermarkProfile":false}'))
      .toEqual({ isPublic: false, watermarkPsn: true, watermarkProfile: false })
    expect(parseUploadDefaults('{"isPublic":"yes","watermarkProfile":true}'))
      .toEqual({ isPublic: true, watermarkPsn: false, watermarkProfile: true })
    expect(parseUploadDefaults('not json')).toEqual(SCREENSHOT_DEFAULTS)
    expect(parseUploadDefaults('[1,2]')).toEqual(SCREENSHOT_DEFAULTS)
  })
})

describe('my screenshots page state', () => {
  it('reads visibility, game and page from the route, ignoring anything unrecognised', () => {
    expect(parseMyScreenshotsQuery({})).toEqual({ visibility: 'all', game: null, page: 1 })
    expect(parseMyScreenshotsQuery({ visibility: 'private', game: '42', page: '3' })).toEqual({ visibility: 'private', game: 42, page: 3 })
    expect(parseMyScreenshotsQuery({ visibility: 'friends', game: 'x', page: '0' })).toEqual({ visibility: 'all', game: null, page: 1 })
    expect(parseMyScreenshotsQuery({ game: '-5' }).game).toBeNull()
  })

  it('round-trips through the URL, leaving out the defaults', () => {
    expect(myScreenshotsRouteQuery({ visibility: 'all', game: null, page: 1 })).toEqual({})
    const state = { visibility: 'public' as const, game: 7, page: 2 }
    expect(myScreenshotsRouteQuery(state)).toEqual({ visibility: 'public', game: '7', page: '2' })
    expect(parseMyScreenshotsQuery(myScreenshotsRouteQuery(state))).toEqual(state)
  })
})
