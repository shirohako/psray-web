import { describe, expect, it } from 'vitest'
import type { ShowcaseLayout, ShowcaseTrophy } from '~/services/profile'
import {
  cloneLayout,
  featuredRefs,
  formatPsnRate,
  layoutAfterPicking,
  moveIndex,
  resolveShowcases,
  sameLayout,
  samePicks,
  toPicked,
} from '~/utils/profileShowcase'

const layout = (featuredOn = false): ShowcaseLayout => ({
  left: [{ key: 'calendar', on: true }, { key: 'rarest', on: true }, { key: 'featured', on: featuredOn }],
  right: [{ key: 'tips', on: true }, { key: 'social', on: true }],
})

const trophy = (id: number, setId = 1): ShowcaseTrophy => ({
  user_id: 1,
  trophy_set_id: setId,
  trophy_id: id,
  earned_at: '2026-11-01T00:00:00.000000Z',
  trophy: {
    id, type: 'gold', name: `Trophy ${id}`, detail: '', icon_url: `https://img.example/${id}.png`,
    psn_earned_rate: '0.4', psray_rate: '1.0', rarity: 'ULTRA RARE', display_language: 'en-US',
  },
  trophy_set: { id: setId, name: 'Game', display_language: 'ja-JP', icon_url: '', platform: ['PS5'] },
})

describe('profile showcases', () => {
  it('renders what the API lists', () => {
    const showcases = { left: ['rarest' as const], right: ['social' as const] }
    expect(resolveShowcases({ showcases, calendar: [{ date: '2026-11-01', count: 1 }], recent_tips: [] })).toBe(showcases)
  })

  it('falls back to the old fixed cards for responses without showcases', () => {
    expect(resolveShowcases({ calendar: [{ date: '2026-11-01', count: 1 }], recent_tips: [] }))
      .toEqual({ left: ['calendar'], right: ['tips', 'social'] })
    // Unregistered (no tips) and private (no calendar).
    expect(resolveShowcases({ calendar: null, recent_tips: null })).toEqual({ left: [], right: ['social'] })
  })

  it('moves an item without touching the original list', () => {
    const list = ['a', 'b', 'c', 'd']
    expect(moveIndex(list, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveIndex(list, 3, 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(moveIndex(list, 1, 99)).toEqual(['a', 'c', 'd', 'b'])
    expect(moveIndex(list, 9, 0)).toEqual(list)
    expect(list).toEqual(['a', 'b', 'c', 'd'])
  })

  it('compares layouts by order and switches', () => {
    const a = layout()
    const b = cloneLayout(a)
    expect(sameLayout(a, b)).toBe(true)
    b.left[0]!.on = false
    expect(a.left[0]!.on).toBe(true)
    expect(sameLayout(a, b)).toBe(false)
    expect(sameLayout(a, { ...a, right: [...a.right].reverse() })).toBe(false)
  })

  it('switches featured on when the first trophy is picked, and only then', () => {
    expect(layoutAfterPicking(layout(), 0, 1).left.find(s => s.key === 'featured')?.on).toBe(true)
    // Already had picks: the owner's switch stays as it is.
    expect(layoutAfterPicking(layout(), 2, 3).left.find(s => s.key === 'featured')?.on).toBe(false)
    // Emptying the list doesn't switch it off.
    expect(layoutAfterPicking(layout(true), 3, 0).left.find(s => s.key === 'featured')?.on).toBe(true)
  })

  it('turns API trophies into picks and picks into stored references', () => {
    const picks = [trophy(7, 2), trophy(3)].map(toPicked)
    expect(picks[0]).toMatchObject({ trophy_set_id: 2, trophy_id: 7, name: 'Trophy 7', set_name: 'Game', display_language: 'en-US' })
    expect(featuredRefs(picks)).toEqual([{ trophy_set_id: 2, trophy_id: 7 }, { trophy_set_id: 1, trophy_id: 3 }])
    expect(samePicks(picks, [...picks])).toBe(true)
    expect(samePicks(picks, [...picks].reverse())).toBe(false)
  })

  it('formats PSN rates', () => {
    expect(formatPsnRate('0.4')).toBe('0.4%')
    expect(formatPsnRate(12)).toBe('12.0%')
    expect(formatPsnRate('n/a')).toBe('—')
  })
})
