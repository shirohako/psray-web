import { describe, expect, it } from 'vitest'
import { formatHourInterval, platformLabel, resolveHourInterval, stopwatch, toIsoDate } from '~/utils/profile'

const compact = (value: string | null) => value?.replace(/\s/g, '')

describe('profile formatting', () => {
  it('preserves PSPC as a distinct platform label', () => {
    expect(platformLabel('PSPC')).toBe('PSPC')
    expect(platformLabel('PSP')).toBe('PSP')
    expect(platformLabel('PSVITA')).toBe('PSV')
  })

  it('formats hour-based sync intervals without rounding', () => {
    expect(compact(formatHourInterval(1, 'ja-JP'))).toBe('1時間')
    expect(compact(formatHourInterval(24, 'ja-JP'))).toBe('1日')
    expect(compact(formatHourInterval(168, 'ja-JP'))).toBe('1週間')
    expect(compact(formatHourInterval(720, 'ja-JP'))).toBe('30日')
    expect(compact(formatHourInterval(8760, 'ja-JP'))).toBe('1年')
  })

  it('treats non-positive or missing intervals as unscheduled', () => {
    expect(formatHourInterval(0, 'ja-JP')).toBeNull()
    expect(formatHourInterval(null, 'ja-JP')).toBeNull()
  })

  it('resolves intervals for localized profile copy', () => {
    expect(resolveHourInterval(1)).toEqual({ amount: 1, unit: 'hour' })
    expect(resolveHourInterval(24)).toEqual({ amount: 1, unit: 'day' })
    expect(resolveHourInterval(168)).toEqual({ amount: 1, unit: 'week' })
    expect(resolveHourInterval(336)).toEqual({ amount: 2, unit: 'week' })
    expect(resolveHourInterval(8760)).toEqual({ amount: 1, unit: 'year' })
  })

  it('turns API timestamps into zoned ISO strings for <LocalTime>', () => {
    expect(toIsoDate('2026-08-10T15:23:07.000000Z')).toBe('2026-08-10T15:23:07.000Z')
    expect(toIsoDate(1_786_000_000)).toBe('2026-08-06T07:06:40.000Z')
    expect(toIsoDate(null)).toBeNull()
    expect(toIsoDate('')).toBeNull()
    expect(toIsoDate('not a date')).toBeNull()
  })

  it('reads durations like a stopwatch, keeping seconds', () => {
    expect(stopwatch(32_232)).toEqual({ days: 0, time: '8:57:12' })
    expect(stopwatch(59)).toEqual({ days: 0, time: '0:00:59' })
    expect(stopwatch(86_400 + 5 * 3600 + 610)).toEqual({ days: 1, time: '05:10:10' })
    expect(stopwatch(400 * 86_400 + 0.9)).toEqual({ days: 400, time: '00:00:00' })
    expect(stopwatch(-5)).toEqual({ days: 0, time: '0:00:00' })
  })
})
