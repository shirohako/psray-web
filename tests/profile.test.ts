import { describe, expect, it } from 'vitest'
import { formatHourInterval, resolveHourInterval } from '~/utils/profile'

const compact = (value: string | null) => value?.replace(/\s/g, '')

describe('profile formatting', () => {
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
})
