import { describe, expect, it } from 'vitest'
import type { Profile, ShowcaseLayout, ShowcaseTrophy } from '~/services/profile'
import {
  SHOWCASE_META,
  cloneLayout,
  featuredRefs,
  formatPsnRate,
  layoutAfterFilling,
  moveIndex,
  resolveShowcases,
  sameGames,
  sameLayout,
  samePicks,
  sameScreenshots,
  sameTexts,
  textLength,
  toPicked,
} from '~/utils/profileShowcase'

const layout = (featuredOn = false): ShowcaseLayout => ({
  left: [
    { key: 'calendar', on: true }, { key: 'rarest', on: true }, { key: 'featured', on: featuredOn },
    { key: 'games', on: false }, { key: 'text_left', on: false },
  ],
  right: [{ key: 'tips', on: true }, { key: 'social', on: true }, { key: 'text_right', on: false }],
})
const isOn = (l: ShowcaseLayout, key: string) => [...l.left, ...l.right].find(s => s.key === key)?.on

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
    const tips = [{ id: 1 }] as unknown as NonNullable<Profile['recent_tips']>
    expect(resolveShowcases({ calendar: [{ date: '2026-11-01', count: 1 }], recent_tips: tips }))
      .toEqual({ left: ['calendar'], right: ['tips', 'social'] })
    // No tips yet: the comments card waits for the first one.
    expect(resolveShowcases({ calendar: [{ date: '2026-11-01', count: 1 }], recent_tips: [] }))
      .toEqual({ left: ['calendar'], right: ['social'] })
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

  it('switches a showcase on when its first content arrives, and only then', () => {
    expect(isOn(layoutAfterFilling(layout(), 'featured', true, false), 'featured')).toBe(true)
    expect(isOn(layoutAfterFilling(layout(), 'games', true, false), 'games')).toBe(true)
    // Works in the right column too.
    expect(isOn(layoutAfterFilling(layout(), 'text_right', true, false), 'text_right')).toBe(true)
    // Already had content: the owner's switch stays as it is.
    expect(isOn(layoutAfterFilling(layout(), 'featured', false, false), 'featured')).toBe(false)
    // Emptying it doesn't switch it off.
    expect(isOn(layoutAfterFilling(layout(true), 'featured', false, true), 'featured')).toBe(true)
    // Other showcases are untouched.
    expect(isOn(layoutAfterFilling(layout(), 'games', true, false), 'text_left')).toBe(false)
  })

  it('compares favorite games by order and texts by content', () => {
    const game = (id: number) => ({ id, name: `Game ${id}`, display_language: null, icon_url: '', platform: ['PS5'] })
    expect(sameGames([game(1), game(2)], [game(1), game(2)])).toBe(true)
    expect(sameGames([game(1), game(2)], [game(2), game(1)])).toBe(false)
    const texts = { left: { title: 'Hi', body: 'x' }, right: { title: '', body: '' } }
    expect(sameTexts(texts, { left: { ...texts.left }, right: { ...texts.right } })).toBe(true)
    expect(sameTexts(texts, { ...texts, right: { title: '', body: 'y' } })).toBe(false)
  })

  it('compares favorite screenshots by order', () => {
    const shot = (id: number) => ({ id, image: { id: `k${id}`, url: '', width: 1, height: 1, color: null, srcset: null }, caption: null, game: null, created_at: '' })
    expect(sameScreenshots([shot(1), shot(2)], [shot(1), shot(2)])).toBe(true)
    expect(sameScreenshots([shot(1), shot(2)], [shot(2), shot(1)])).toBe(false)
    expect(sameScreenshots([shot(1)], [])).toBe(false)
  })

  it('has settings labels for every showcase key', () => {
    const keys = ['calendar', 'rarest', 'featured', 'games', 'text_left', 'favorite_screenshots', 'tips', 'social', 'text_right', 'screenshots'] as const
    expect(Object.keys(SHOWCASE_META).sort()).toEqual([...keys].sort())
  })

  it('counts text length in characters, as the API does', () => {
    expect(textLength('ようこそ')).toBe(4)
    expect(textLength('🎮🏆')).toBe(2)
    expect(textLength('')).toBe(0)
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
