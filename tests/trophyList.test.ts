import { describe, expect, it } from 'vitest'
import type { EarnedInfo, Trophy, TrophyGroup, ViewerProgress } from '~/services/trophies'
import {
  buildEarnedInfo,
  buildTrophyNumbers,
  countVisibleTrophies,
  filterTrophies,
  isTrophyEarned,
  sortTrophies,
  sortTrophyGroups,
} from '~/utils/trophyList'

const trophy = (id: number, extra: Partial<Trophy> = {}): Trophy => ({
  id,
  trophy_group_id: 1,
  type: 'bronze',
  np_communication_id: 'NPWR00000_00',
  psn_group_id: 'default',
  psn_trophy_id: id,
  name: `Trophy ${id}`,
  detail: '',
  icon_url: '',
  is_hidden: false,
  psn_earned_rate: 50,
  psray_rate: 50,
  earned_count: 0,
  rarity: 'COMMON',
  tip_count: 0,
  ...extra,
})

const group = (id: number, psnGroupId: string, trophies: Trophy[] = []): TrophyGroup => ({
  id,
  psn_group_id: psnGroupId,
  name: psnGroupId,
  detail: '',
  icon_url: '',
  defined_trophies: { bronze: trophies.length, silver: 0, gold: 0, platinum: 0 },
  trophies,
})

const progress = (earned: number[], at: ViewerProgress['earned_trophies_at']): ViewerProgress => ({
  psnid: 'player',
  avatar_url: '',
  progress: 50,
  earned_bronze: earned.length,
  earned_silver: 0,
  earned_gold: 0,
  earned_platinum: 0,
  first_earned_at: null,
  last_earned_at: null,
  earned_trophies: earned,
  earned_trophies_at: at,
})

const earned = (...ids: number[]) =>
  new Map<number, EarnedInfo>(ids.map((id, rank) => [id, { rank, earnedAt: null, sincePrev: null, timestampMissing: false }]))

describe('viewer earned order', () => {
  it('is empty without viewer progress', () => {
    expect(buildEarnedInfo(null, []).size).toBe(0)
    expect(buildEarnedInfo(undefined, []).size).toBe(0)
  })

  it('ranks by earned time, whatever order the API lists them in', () => {
    const info = buildEarnedInfo(progress([3, 1, 2], {
      1: '2025-01-01T00:00:00Z',
      2: '2025-01-01T00:01:30Z',
      3: 1_735_689_700, // unix seconds: 2025-01-01T00:01:40Z
    }), [])
    expect(info.get(1)).toEqual({ rank: 0, earnedAt: '2025-01-01T00:00:00Z', sincePrev: null, timestampMissing: false })
    expect(info.get(2)).toMatchObject({ rank: 1, sincePrev: 90 })
    expect(info.get(3)).toMatchObject({ rank: 2, earnedAt: 1_735_689_700, sincePrev: 10 })
  })

  it('ranks platinum after the trophy that shares its timestamp', () => {
    const groups = [group(1, 'default', [trophy(1, { type: 'platinum' }), trophy(2)])]
    const info = buildEarnedInfo(progress([1, 2], { 1: 1_000, 2: 1_000 }), groups)
    expect(info.get(2)?.rank).toBe(0)
    expect(info.get(1)).toMatchObject({ rank: 1, sincePrev: 0 })
  })

  it('puts trophies without a time last, flagging the ones PSN never timed', () => {
    const info = buildEarnedInfo(progress([1, 2, 3], { 1: null, 2: 2_000, 3: 1_000 }), [])
    expect(info.get(3)?.rank).toBe(0)
    expect(info.get(2)).toMatchObject({ rank: 1, sincePrev: 1_000 })
    expect(info.get(1)).toEqual({ rank: 2, earnedAt: null, sincePrev: null, timestampMissing: true })
  })

  it('measures gaps from the last timed trophy and treats absent times as unknown', () => {
    const info = buildEarnedInfo(progress([1, 2, 3], { 1: 1_000, 3: 1_060 }), [])
    expect(info.get(3)).toMatchObject({ rank: 1, sincePrev: 60 })
    // Absent from the time map: unknown, but not "PSN never recorded it".
    expect(info.get(2)).toMatchObject({ rank: 2, sincePrev: null, timestampMissing: false })
  })
})

describe('trophy group order', () => {
  it('puts the base game first, then DLC groups in PSN order', () => {
    const groups = [group(4, 'extra'), group(3, '002'), group(2, 'default'), group(1, '001')]
    expect(sortTrophyGroups(groups).map(g => g.psn_group_id)).toEqual(['default', '001', '002', 'extra'])
  })

  it('orders trophies by PSN id without touching the input', () => {
    const input = [group(1, 'default', [trophy(10, { psn_trophy_id: 2 }), trophy(11, { psn_trophy_id: 0 }), trophy(12, { psn_trophy_id: 1 })])]
    expect(sortTrophyGroups(input)[0]!.trophies.map(t => t.id)).toEqual([11, 12, 10])
    expect(input[0]!.trophies.map(t => t.id)).toEqual([10, 11, 12])
  })

  it('numbers trophies from PSN ids, starting at 1 in each group', () => {
    const numbers = buildTrophyNumbers([
      group(1, 'default', [trophy(10, { psn_trophy_id: 0 }), trophy(11, { psn_trophy_id: 1 })]),
      group(2, '001', [trophy(20, { psn_trophy_id: 0 })]),
    ])
    expect([...numbers]).toEqual([[10, 1], [11, 2], [20, 1]])
  })
})

describe('trophy list filter and sort', () => {
  const list = [trophy(1, { psn_earned_rate: '12.5' }), trophy(2, { psn_earned_rate: 3 }), trophy(3, { psn_earned_rate: 40 })]

  it('counts a trophy as earned only with a viewer, preferring the API flag', () => {
    expect(isTrophyEarned(trophy(1), false, earned(1))).toBe(false)
    expect(isTrophyEarned(trophy(1), true, earned(1))).toBe(true)
    expect(isTrophyEarned(trophy(1, { earned_by_viewer: false }), true, earned(1))).toBe(false)
    expect(isTrophyEarned(trophy(2, { earned_by_viewer: true }), true, earned())).toBe(true)
  })

  it('filters by earned state only with a viewer', () => {
    expect(filterTrophies(list, 'earned', true, earned(3, 1)).map(t => t.id)).toEqual([1, 3])
    expect(filterTrophies(list, 'unearned', true, earned(3, 1)).map(t => t.id)).toEqual([2])
    expect(filterTrophies(list, 'earned', false, earned(3, 1))).toBe(list)
    expect(filterTrophies(list, 'all', true, earned(3, 1))).toBe(list)
  })

  it('sorts rarest first by PSN earn rate', () => {
    expect(sortTrophies(list, 'rarity', false, earned()).map(t => t.id)).toEqual([2, 1, 3])
  })

  it('sorts by earned order with the unearned after, given a viewer', () => {
    expect(sortTrophies(list, 'earned', true, earned(3, 1)).map(t => t.id)).toEqual([3, 1, 2])
    expect(sortTrophies(list, 'earned', false, earned(3, 1))).toBe(list)
    expect(sortTrophies(list, 'default', true, earned(3, 1))).toBe(list)
  })

  it('counts the trophies a filter leaves across groups', () => {
    const groups = [group(1, 'default', list), group(2, '001', [trophy(4)])]
    expect(countVisibleTrophies(groups, 'all', true, earned(1))).toBe(4)
    expect(countVisibleTrophies(groups, 'earned', true, earned(1, 4))).toBe(2)
    expect(countVisibleTrophies(groups, 'unearned', true, earned(1, 4))).toBe(2)
    expect(countVisibleTrophies(groups, 'earned', false, earned(1, 4))).toBe(4)
  })
})
