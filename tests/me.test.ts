import { describe, expect, it } from 'vitest'
import { myFollowsRouteQuery, myTipsRouteQuery, parseMyFollowsQuery, parseMyTipsQuery } from '~/utils/me'

describe('my follows page state', () => {
  it('reads the tab and page from the route, ignoring anything unrecognised', () => {
    expect(parseMyFollowsQuery({})).toEqual({ tab: 'following', page: 1 })
    expect(parseMyFollowsQuery({ tab: 'followers', page: '3' })).toEqual({ tab: 'followers', page: 3 })
    expect(parseMyFollowsQuery({ tab: 'friends', page: '-2' })).toEqual({ tab: 'following', page: 1 })
    expect(parseMyFollowsQuery({ tab: ['followers', 'following'], page: 'x' })).toEqual({ tab: 'followers', page: 1 })
  })

  it('writes short URLs, leaving out the defaults', () => {
    expect(myFollowsRouteQuery({ tab: 'following', page: 1 })).toEqual({})
    expect(myFollowsRouteQuery({ tab: 'followers', page: 2 })).toEqual({ tab: 'followers', page: '2' })
  })
})

describe('my tips page state', () => {
  it('reads sort, search and page from the route, ignoring anything unrecognised', () => {
    expect(parseMyTipsQuery({})).toEqual({ sort: 'updated', q: '', page: 1 })
    expect(parseMyTipsQuery({ sort: 'helpful', q: '  boss  ', page: '4' })).toEqual({ sort: 'helpful', q: 'boss', page: 4 })
    expect(parseMyTipsQuery({ sort: 'random' }).sort).toBe('updated')
    expect(parseMyTipsQuery({ q: 'x'.repeat(150) }).q).toHaveLength(100)
  })

  it('round-trips through the URL, leaving out the defaults', () => {
    expect(myTipsRouteQuery({ sort: 'updated', q: '', page: 1 })).toEqual({})
    const state = { sort: 'created' as const, q: 'boss', page: 2 }
    expect(myTipsRouteQuery(state)).toEqual({ sort: 'created', q: 'boss', page: '2' })
    expect(parseMyTipsQuery(myTipsRouteQuery(state))).toEqual(state)
  })
})
