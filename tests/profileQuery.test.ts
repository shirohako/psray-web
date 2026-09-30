import { describe, expect, it } from 'vitest'
import { parseProfileQuery, profileRouteQuery } from '~/utils/profileQuery'

describe('profile route query', () => {
  it('omits defaults so the plain profile keeps a clean URL', () => {
    expect(profileRouteQuery({ tab: 'recent', page: 1, q: '' })).toEqual({})
    expect(parseProfileQuery({})).toEqual({ tab: 'recent', page: 1, q: '' })
  })

  it('round-trips tab, page and search', () => {
    const recent = { tab: 'recent', page: 3, q: 'zelda' } as const
    expect(profileRouteQuery(recent)).toEqual({ q: 'zelda', page: '3' })
    expect(parseProfileQuery(profileRouteQuery(recent))).toEqual(recent)

    const trophies = { tab: 'trophies', page: 5, q: '' } as const
    expect(profileRouteQuery(trophies)).toEqual({ tab: 'trophies', page: '5' })
    expect(parseProfileQuery(profileRouteQuery(trophies))).toEqual(trophies)
  })

  it('drops values the tab does not use', () => {
    expect(parseProfileQuery({ tab: 'trophies', q: 'zelda' }).q).toBe('')
    expect(parseProfileQuery({ tab: 'milestones', page: '4' }).page).toBe(1)
    expect(profileRouteQuery({ tab: 'milestones', page: 4, q: 'zelda' })).toEqual({ tab: 'milestones' })
  })

  it('falls back to defaults for unknown or malformed values', () => {
    expect(parseProfileQuery({ tab: 'bogus', page: '-2', q: null })).toEqual({ tab: 'recent', page: 1, q: '' })
    expect(parseProfileQuery({ tab: ['trophies', 'recent'], page: ['abc'] })).toEqual({ tab: 'trophies', page: 1, q: '' })
    expect(parseProfileQuery({ q: '  zelda  ' }).q).toBe('zelda')
  })
})
