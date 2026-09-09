import { describe, expect, it } from 'vitest'
import { emptyLibraryFilters, trophyBrowsePath, trophyBrowseQuery } from '~/utils/trophyLibrary'

describe('trophy browser API query', () => {
  it('uses the API defaults and category sort values', () => {
    const filters = emptyLibraryFilters()
    expect(trophyBrowseQuery('new', filters, 1)).toEqual({ page: 1, per_page: 24, sort: 'newest' })
    expect(trophyBrowseQuery('trending', filters, 2).sort).toBe('recent_hot')
    expect(trophyBrowseQuery('popular', filters, 3).sort).toBe('popular')
  })

  it('submits platform arrays using canonical API values', () => {
    const filters = { ...emptyLibraryFilters(), platforms: ['PS5', 'PSVITA', 'PSPC'] }
    const query = trophyBrowseQuery('new', filters, 1)
    expect(query['platform[]']).toEqual(['PS5', 'PSVITA', 'PSPC'])
    expect(trophyBrowsePath(query)).toContain('platform%5B%5D=PS5&platform%5B%5D=PSVITA&platform%5B%5D=PSPC')
  })

  it('maps platinum and player filters to server-side bounds', () => {
    const query = trophyBrowseQuery('popular', {
      ...emptyLibraryFilters(),
      platinum: 'no',
      owners: 'from1000',
    }, 4)
    expect(query).toMatchObject({
      page: 4,
      sort: 'popular',
      has_platinum: 0,
      owners_min: 1000,
      owners_max: 9999,
    })
    expect(trophyBrowseQuery('new', { ...emptyLibraryFilters(), platinum: 'yes' }, 1).has_platinum).toBe(1)
  })

  it.each([
    ['under5', undefined, 4.9],
    ['from5', 5, 14.9],
    ['from15', 15, 29.9],
    ['from30', 30, 49.9],
    ['from50', 50, undefined],
  ] as const)('maps the %s platinum-rate band without overlap', (rate, minimum, maximum) => {
    const query = trophyBrowseQuery('new', { ...emptyLibraryFilters(), rate }, 1)
    expect(query.platinum_rate_min).toBe(minimum)
    expect(query.platinum_rate_max).toBe(maximum)
  })

  it('trims search text to the API limit', () => {
    const query = trophyBrowseQuery('new', {
      ...emptyLibraryFilters(),
      search: `  ${'x'.repeat(120)}  `,
    }, 1)
    expect(query.q).toHaveLength(100)
  })
})
