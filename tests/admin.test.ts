import { describe, expect, it } from 'vitest'
import { adminApiPrefix, adminQuery, adminValue } from '../app/utils/admin'
describe('admin contract helpers', () => {
  it('addresses canonical API without a duplicate api prefix', () => {
    expect(adminApiPrefix('https://api.psray.net')).toBe('/api/admin')
    expect(adminApiPrefix('http://localhost:8000/api')).toBe('/admin')
    expect(adminApiPrefix('http://localhost:8000/api/')).toBe('/admin')
  })
  it('does not send presentation state or empty filters to the API', () => {
    expect(
      adminQuery({
        q: 'name',
        tab: 'failed',
        detail: '12',
        page: '2',
        status: '',
        active: '0',
      }),
    ).toEqual({ q: 'name', page: '2', active: '0' })
  })
  it('distinguishes partial failure, missing status and booleans', () => {
    expect(adminValue('partial')).toBe('部分失败')
    expect(adminValue(null)).toBe('—')
    expect(adminValue(false)).toBe('否')
    expect(adminValue(0)).toBe('0')
  })
})
