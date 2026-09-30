import { describe, expect, it } from 'vitest'
import { leaderboardRouteQuery, parseLeaderboardQuery } from '~/utils/leaderboardQuery'

const boards = ['points', 'points-region'] as const

describe('leaderboard route query', () => {
  it('omits defaults so the plain leaderboard keeps a clean URL', () => {
    const state = { board: 'points', region: 'JP', registeredOnly: false, page: 1 }
    expect(leaderboardRouteQuery(state, 'points')).toEqual({})
    expect(parseLeaderboardQuery({}, boards)).toEqual(state)
  })

  it('round-trips board, filters and page', () => {
    const state = { board: 'points-region', region: 'US', registeredOnly: true, page: 4 }
    const query = leaderboardRouteQuery(state, 'points')
    expect(query).toEqual({ board: 'points-region', region: 'US', registered: '1', page: '4' })
    expect(parseLeaderboardQuery(query, boards)).toEqual(state)
  })

  it('falls back to defaults for unknown or malformed values', () => {
    expect(parseLeaderboardQuery({
      board: 'tips',
      region: 'XX',
      registered: 'yes',
      page: '0',
    }, boards)).toEqual({ board: 'points', region: 'JP', registeredOnly: false, page: 1 })
    expect(parseLeaderboardQuery({ region: 'us', page: ['2', '3'] }, boards)).toMatchObject({ region: 'US', page: 2 })
  })
})
