import { describe, expect, it } from 'vitest'
import { adminApiPrefix, adminQuery, adminValue } from '../app/utils/admin'
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
})
