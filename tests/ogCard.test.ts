import { describe, expect, it } from 'vitest'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  TIER_COLORS,
  clampTitle,
  num,
  platformLabel,
  profileCardHtml,
  trophyCardHtml,
} from '../server/utils/ogCard'

const trophies = { platinum: 42, gold: 310, silver: 1204, bronze: 5678 }

const profile = {
  psnid: 'ShionAri',
  trophyLevel: 512,
  rank: 1234,
  trophies,
  playedGames: 987,
  avatar: 'data:image/png;base64,AAAA',
  flag: 'data:image/svg+xml;base64,BBBB',
  logo: 'data:image/png;base64,LLLL',
}

const set = {
  name: 'Life is Strange: Double Exposure',
  platforms: ['PS5', 'PSVITA'],
  trophies,
  owners: 12480,
  averageProgress: 37.4,
  icon: 'data:image/png;base64,CCCC',
  logo: 'data:image/png;base64,LLLL',
}

describe('OG card markup', () => {
  it('renders at the 2:1 geometry every platform crops to', () => {
    expect(CARD_WIDTH / CARD_HEIGHT).toBeCloseTo(1200 / 630)
    expect(profileCardHtml(profile)).toContain(`width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px`)
  })

  it('groups digits so six-figure trophy counts stay readable', () => {
    expect(num(5678)).toBe('5,678')
    const markup = profileCardHtml(profile)
    expect(markup).toContain('5,678')
    // Platinum + gold + silver + bronze, shown as the headline total.
    expect(markup).toContain('7,234')
  })

  it('paints each trophy tier in the site palette', () => {
    const markup = profileCardHtml(profile)
    for (const color of Object.values(TIER_COLORS)) expect(markup).toContain(color)
  })

  it('shows the player identity and rank', () => {
    const markup = profileCardHtml(profile)
    expect(markup).toContain('ShionAri')
    expect(markup).toContain('Level 512')
    expect(markup).toContain('#1,234')
  })

  it('omits the rank line for an unranked player', () => {
    // `#` alone would match every hex colour, so assert on the rendered rank.
    expect(profileCardHtml({ ...profile, rank: null })).not.toContain('#1,234')
  })

  it('falls back to a placeholder tile rather than a broken image', () => {
    const markup = profileCardHtml({ ...profile, avatar: null, flag: null, logo: null })
    expect(markup).not.toContain('<img')
    expect(markup).toContain('width:176px;height:176px')
  })

  it('signs both cards with the gamepad mark beside the wordmark', () => {
    for (const markup of [profileCardHtml(profile), trophyCardHtml(set)]) {
      expect(markup).toContain('data:image/png;base64,LLLL')
      expect(markup).toContain('PSRay')
    }
  })

  it('keeps the wordmark when the logo could not be read', () => {
    const markup = trophyCardHtml({ ...set, logo: null })
    expect(markup).toContain('PSRay')
    expect(markup).not.toContain('LLLL')
  })

  it('abbreviates the Vita platform badge the way the site does', () => {
    expect(platformLabel('PSVITA')).toBe('PSV')
    const markup = trophyCardHtml(set)
    expect(markup).toContain('>PSV<')
    expect(markup).toContain('>PS5<')
  })

  it('rounds average progress and keeps the owner count grouped', () => {
    const markup = trophyCardHtml(set)
    expect(markup).toContain('37%')
    expect(markup).toContain('12,480')
  })

  it('closes every element it opens', () => {
    // satori-html tolerates unbalanced markup by silently renesting it, which
    // shows up only as a wrong-looking card — so assert the structure here.
    for (const markup of [profileCardHtml(profile), trophyCardHtml(set)]) {
      const opened = (markup.match(/<div\b/g) ?? []).length
      const closed = (markup.match(/<\/div>/g) ?? []).length
      expect(closed).toBe(opened)
    }
  })

  it('titles the trophy card with the set name', () => {
    expect(trophyCardHtml(set)).toContain('Life is Strange: Double Exposure')
  })

  it('keeps a Japanese title to two lines, budgeting CJK glyphs as full width', () => {
    const long = 'ライフ イズ ストレンジ ダブルエクスポージャー コンプリートエディション'
    const clamped = clampTitle(long)
    expect(clamped.endsWith('…')).toBe(true)
    expect(clamped.length).toBeLessThan(long.length)
    // A Latin title of the same character count still fits: half the width each.
    expect(clampTitle('Life is Strange: Double Exposure')).toBe('Life is Strange: Double Exposure')
  })

  it('escapes a title that contains markup characters', () => {
    expect(trophyCardHtml({ ...set, name: 'Trine 2 <Director\'s Cut>' }))
      .toContain('Trine 2 &lt;Director\'s Cut&gt;')
  })

  it('rounds the avatar tile without clipping it to a circle', () => {
    expect(profileCardHtml(profile)).toContain('width:176px;height:176px;border-radius:28px')
  })
})
