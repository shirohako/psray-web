import { describe, expect, it } from 'vitest'
import { leaderboardBoardPath, leaderboardRouteQuery, parseLeaderboardQuery } from '~/utils/leaderboardQuery'

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

  it('links a profile rank to the plain board, with the player kept out of the URL', () => {
    expect(leaderboardBoardPath()).toBe('/leaderboard')
    expect(leaderboardBoardPath('JP')).toBe('/leaderboard?board=points-region')
    expect(leaderboardBoardPath('HK')).toBe('/leaderboard?board=points-region&region=HK')
    // Anything else in the URL is not read as a player.
    expect(parseLeaderboardQuery({ player: 'Kirara_07' }, boards)).toEqual({ board: 'points', region: 'JP', registeredOnly: false, page: 1 })
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
