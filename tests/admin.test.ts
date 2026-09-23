import { describe, expect, it } from 'vitest'
import {
  adminApiPrefix,
  adminDate,
  adminDuration,
  adminField,
  adminLocalToUtc,
  adminQuery,
  adminValue,
} from '../app/utils/admin'
describe('admin contract helpers', () => {
  it('addresses admin routes from the shared API origin', () => {
    expect(adminApiPrefix('https://api.psray.net')).toBe(
      'https://api.psray.net/admin',
    )
    expect(adminApiPrefix('http://localhost:8000/')).toBe(
      'http://localhost:8000/admin',
    )
    expect(adminApiPrefix('')).toBe('/admin')
  })
  it('does not send presentation state or empty filters to the API', () => {
    expect(
      adminQuery({
        q: 'name',
        tab: 'failed',
        detail: '12',
        page: '2',
        status: '',
        available: '0',
      }),
    ).toEqual({ q: 'name', page: '2', available: '0' })
  })
  it('distinguishes partial failure, missing status and booleans', () => {
    expect(adminValue('partial')).toBe('部分失败')
    expect(adminValue(null)).toBe('—')
    expect(adminValue(false)).toBe('否')
    expect(adminValue(0)).toBe('0')
  })
  // Expectations are built with local getters so the suite passes in any TZ.
  const local = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  }
  it('shows API timestamps in browser time, reading zone-less values as UTC', () => {
    const instant = new Date(Date.UTC(2026, 8, 24, 1, 2, 3))
    expect(adminDate('2026-09-24T01:02:03Z')).toBe(local(instant))
    expect(adminDate('2026-09-24 01:02:03')).toBe(local(instant))
    expect(adminDate('2026-09-24T01:02:03.000000Z')).toBe(local(instant))
    expect(adminDate(instant.getTime() / 1000)).toBe(local(instant))
    expect(adminDate(null)).toBe('—')
    expect(adminDate('not a date')).toBe('not a date')
  })
  it('formats only timestamp fields as dates', () => {
    const instant = new Date(Date.UTC(2026, 8, 24, 1, 2, 3))
    expect(adminField('created_at', '2026-09-24 01:02:03')).toBe(local(instant))
    expect(adminField('status', 'partial')).toBe('部分失败')
  })
  it('humanizes durations', () => {
    expect(adminDuration(842)).toBe('842 毫秒')
    expect(adminDuration(1834)).toBe('1.8 秒')
    expect(adminDuration(12_400)).toBe('12 秒')
    expect(adminDuration(192_000)).toBe('3 分 12 秒')
    expect(adminDuration(180_000)).toBe('3 分')
    expect(adminDuration(7_500_000)).toBe('2 小时 5 分')
    expect(adminDuration(97_200_000)).toBe('1 天 3 小时')
    expect(adminDuration(null)).toBe('—')
    expect(adminField('duration_ms', 842)).toBe('842 毫秒')
  })
  it('sends local date filters to the API in UTC', () => {
    const utc = new Date('2026-09-24T09:30').toISOString().slice(0, 16)
    expect(adminLocalToUtc('2026-09-24T09:30')).toBe(utc)
    expect(adminLocalToUtc('')).toBe('')
  })
})
